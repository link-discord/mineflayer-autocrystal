"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AutoCrystal = void 0;
const vec3_1 = require("vec3");
class AutoCrystal {
    /**
     * Options for the `AutoCrystal` class.
     * @typedef {Object} Options
     * @property {boolean} [ignoreInventoryCheck=true] If the inventory check should be ignored.
     * @property {boolean} [logErrors=false] If errors should be logged.
     * @property {number} [damageThreshold=5] - If the damage exceeds the threshold, it will not place / break the crystal.
     * @property {number} [delay=1] - The delay in ticks between each crystal placement.
     * @property {string} placeMode - The mode used to place the crystal. Can be "suicide", "safe" or "damage".
     * The "damage" place mode will place the crystal on the block where the damage for the bot is the lowest
     * and the damage for the opponent is the highest.
     * @property {string} breakMode - The mode used to break the crystal.
     */
    /**
     * @param {Options} options
     * @param {Bot} bot
     */
    constructor(bot, options = {
        ignoreInventoryCheck: true,
        logErrors: false,
        placeMode: 'safe',
        breakMode: 'safe',
        damageThreshold: 5,
        delay: 1
    }) {
        this.bot = bot;
        this.options = options;
        this.run = true;
        this.started = false;
        this.enabled = false;
        bot.on('physicsTick', () => {
            const player = this.getNearestPlayer();
            if (!this.enabled && this.started)
                this.stop();
            else if (player && !this.started && this.enabled)
                this.start();
            else if (!player && this.started && this.enabled)
                this.stop();
        });
    }
    /**
     * Finds the best position to place the crystal on to.
     * @async
     * @param {Vec3} position Vec3 position.
     * @returns {Vec3} The position to place the crystal on.
     * @memberof AutoCrystal
     * @private
     */
    findPosition(entity) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.enabled)
                return null;
            const entity_position = new vec3_1.Vec3(Math.floor(entity.position.x), Math.floor(entity.position.y), Math.floor(entity.position.z));
            let positions = this.bot.findBlocks({
                point: this.bot.entity.position,
                maxDistance: 4,
                count: 50,
                matching: (block) => block.name === 'obsidian' || block.name === 'bedrock'
            });
            positions = positions.filter((block) => Math.round(block.distanceTo(entity_position)) >= 1 &&
                Math.round(block.distanceTo(entity_position)) <= 10 &&
                Math.round(this.bot.entity.position.y) <= entity_position.y &&
                this.bot.entity.position.xzDistanceTo(block) >= 1.3);
            positions = positions.filter((block) => this.bot.blockAt(block.offset(0, 1, 0)).name === 'air');
            if (this.options.placeMode === 'damage' && positions && positions.length >= 1) {
                try {
                    const arr = positions.map((pos) => {
                        return {
                            position: pos,
                            selfDamage: this.bot.getExplosionDamages(this.bot.entity, pos, 6, true),
                            enemyDamage: this.bot.getExplosionDamages(entity, pos, 6, true)
                        };
                    });
                    // check if there is a position that would kill the enemy
                    const { position: killPosition } = arr.find((pos) => pos.enemyDamage >= entity.health && pos.selfDamage < this.bot.entity.health);
                    // use that position so the whole array doesn't have to be sorted
                    if (killPosition)
                        return killPosition;
                    let bestPositions = arr.sort(function (a, b) {
                        return b.enemyDamage - b.selfDamage - (a.enemyDamage - a.selfDamage);
                    });
                    bestPositions = bestPositions.filter((pos) => this.bot.health > pos.selfDamage);
                    if (bestPositions.length >= 1) {
                        const { position: bestPosition } = bestPositions[0];
                        return bestPosition;
                    }
                }
                catch (error) {
                    if (this.options.logErrors)
                        this.bot.emit('error', error);
                }
            }
            const position = positions[0];
            if (!position || !this.bot.blockAt(position))
                return null;
            const damage = this.bot.getExplosionDamages(this.bot.entity, position.offset(0, 1, 0), 6, true);
            if (positions && positions.length >= 1) {
                if (this.options.placeMode === 'safe' &&
                    this.bot.game.difficulty !== 'peaceful' &&
                    (damage > this.options.damageThreshold || damage >= this.bot.health)) {
                    return null;
                }
                return position;
            }
            return null;
        });
    }
    /**
     * Places the crystal on the specified position.
     * @async
     * @param {Vec3} position Vec3 position.
     * @returns {boolean} A boolean indicating if the crystal was placed.
     * @memberof AutoCrystal
     * @private
     */
    placeCrystal(position) {
        return __awaiter(this, void 0, void 0, function* () {
            const crystal = this.bot.nearestEntity((entity) => entity.name === 'end_crystal');
            if (!crystal || crystal.position !== position.offset(0, 1, 0)) {
                yield this.bot.lookAt(position, true);
                yield this.bot.placeEntity(this.bot.blockAt(position), new vec3_1.Vec3(0, 1, 0));
                return true;
            }
            else if (crystal && crystal.position.distanceTo(this.bot.entity.position) <= 4) {
                yield this.breakCrystal(crystal);
            }
            return false;
        });
    }
    /**
     * Breaks the nearest crystal
     * @async
     * @param {Entity} entity The crystal to break.
     * @returns {boolean} A boolean indicating if the crystal was broken.
     * @memberof AutoCrystal
     * @private
     */
    breakCrystal(crystal) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.enabled)
                return false;
            if (!crystal)
                crystal = this.bot.nearestEntity((entity) => entity.name === 'end_crystal');
            if (crystal) {
                const damage = this.bot.getExplosionDamages(this.bot.entity, crystal.position, 6, true);
                if (this.options.breakMode === 'safe' &&
                    this.bot.game.difficulty !== 'peaceful' &&
                    (damage > this.options.damageThreshold || damage >= this.bot.health)) {
                    return false;
                }
                yield this.bot.waitForTicks(1);
                this.bot.attack(crystal);
                return true;
            }
            else {
                return false;
            }
        });
    }
    /**
     * Gets the nearest player
     * @async
     * @returns {Player} The nearest player entity object.
     * @returns {null} If no player is found.
     * @memberof AutoCrystal
     * @private
     */
    getNearestPlayer() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.enabled)
                return null;
            const player = this.bot.nearestEntity((entity) => entity.type === 'player' && entity.position.distanceTo(this.bot.entity.position) <= 6);
            if (player)
                return player;
            else
                return null;
        });
    }
    /**
     * Gets holes near the bot.
     * @async
     * @returns {Vec3[]} An array of Vec3 positions
     * @memberof AutoCrystal
     */
    getHoles() {
        return __awaiter(this, void 0, void 0, function* () {
            let holes = [];
            const blocks = this.bot.findBlocks({
                point: this.bot.entity.position,
                maxDistance: 10,
                count: 2000,
                matching: (block) => block.name === 'bedrock'
            });
            for (let index = 0; index < blocks.length; index++) {
                const block = blocks[index];
                if (this.bot.blockAt(block.offset(0, 1, 0)).name === 'air' &&
                    this.bot.blockAt(block.offset(0, 2, 0)).name === 'air' &&
                    this.bot.blockAt(block.offset(0, 3, 0)).name === 'air' &&
                    this.bot.blockAt(block.offset(1, 1, 0)).name === 'bedrock' &&
                    this.bot.blockAt(block.offset(0, 1, 1)).name === 'bedrock' &&
                    this.bot.blockAt(block.offset(-1, 1, 0)).name === 'bedrock' &&
                    this.bot.blockAt(block.offset(0, 1, -1)).name === 'bedrock')
                    holes.push(block);
            }
            return holes;
        });
    }
    /**
     * Starts the auto crystal
     * @async
     * @returns {Promise<void>}
     * @memberof AutoCrystal
     * @private
     */
    start() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.started || !this.enabled)
                return;
            this.started = true;
            // loop to start the auto crystal
            while (this.run) {
                const player = yield this.getNearestPlayer();
                const crystal = this.bot.inventory.items().find((item) => item.name === 'end_crystal');
                if (player && crystal) {
                    if (!this.bot.heldItem || this.bot.heldItem.name !== crystal.name) {
                        const requiresConfirmation = this.bot.inventory.requiresConfirmation;
                        if (this.options.ignoreInventoryCheck)
                            this.bot.inventory.requiresConfirmation = false;
                        this.bot.inventory.requiresConfirmation = requiresConfirmation;
                        yield this.bot.equip(crystal, 'hand');
                    }
                    try {
                        yield this.bot.waitForTicks(this.options.delay);
                        const position = yield this.findPosition(player);
                        if (position) {
                            const placed = yield this.placeCrystal(position);
                            if (placed)
                                yield this.breakCrystal();
                        }
                    }
                    catch (error) {
                        this.run = false;
                        if (this.options.logErrors)
                            this.bot.emit('error', error);
                    }
                }
                else {
                    this.run = false;
                }
            }
            this.started = false;
            this.run = true;
        });
    }
    /**
     * Stops the auto crystal
     * @async
     * @returns {Promise<void>}
     * @memberof AutoCrystal
     * @private
     */
    stop() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.enabled)
                return;
            this.run = false;
        });
    }
    /**
     * Disables the AutoCrystal
     * @async
     * @returns {Promise<boolean>}
     * @memberof AutoCrystal
     */
    disable() {
        return __awaiter(this, void 0, void 0, function* () {
            this.enabled = false;
            return true;
        });
    }
    /**
     * Enables the AutoCrystal
     * @async
     * @returns {Promise<boolean>}
     * @memberof AutoCrystal
     */
    enable() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.started)
                return false;
            this.enabled = true;
            return true;
        });
    }
}
exports.AutoCrystal = AutoCrystal;
