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
     * @param {Options} options
     * @param {Bot} bot
     * @constructor
     * @private
     */
    constructor(bot, options = {
        placeMode: 'safe',
        breakMode: 'safe',
        damageThreshold: 5,
        delay: 1
    }) {
        this.bot = bot;
        this.options = options;
        this.tick = 50;
        this.run = true;
        this.started = false;
        this.enabled = false;
        bot.on('physicsTick', () => {
            const player = this.getNearestPlayer();
            if (player && !this.started && this.enabled)
                this.start();
            else if (!player && this.started && this.enabled)
                this.stop();
        });
    }
    /**
     * Places a crystal close to the position if possible
     * @async
     * @param {Vec3} A Vec3 position.
     * @returns {Boolean} A boolean if it worked or not.
     * @memberof AutoCrystal
     * @private
     */
    placeCrystal(position) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.enabled)
                return false;
            position = new vec3_1.Vec3(Math.floor(position.x), Math.floor(position.y), Math.floor(position.z));
            let blocks = this.bot.findBlocks({
                point: this.bot.entity.position,
                maxDistance: 4,
                count: 50,
                matching: (block) => block.name === 'obsidian' || block.name === 'bedrock'
            });
            blocks = blocks.filter((block) => Math.round(block.distanceTo(position)) >= 1 &&
                Math.round(block.distanceTo(position)) <= 10 &&
                Math.round(this.bot.entity.position.y) <= position.y &&
                this.bot.entity.position.xzDistanceTo(block) >= 1);
            blocks = blocks.filter((block) => this.bot.blockAt(block.offset(0, 1, 0)).name === 'air');
            const block = blocks[0];
            if (!block || !this.bot.blockAt(block))
                return null;
            const damage = this.bot.getExplosionDamages(this.bot.entity, block.offset(0, 1, 0), 6);
            if ((blocks && blocks.length > 1 && this.bot.blockAt(block).name === 'obsidian') || this.bot.blockAt(block).name === 'bedrock') {
                try {
                    if ((this.options.placeMode === 'safe' && damage > this.options.damageThreshold) ||
                        (this.options.placeMode === 'safe' && damage >= this.bot.health))
                        return false;
                    yield this.bot.lookAt(block, true);
                    yield this.bot.placeEntity(this.bot.blockAt(block), new vec3_1.Vec3(0, 1, 0));
                }
                catch (error) { }
                return true;
            }
            return false;
        });
    }
    /**
     * Breaks the nearest crystal
     * @async
     * @returns {Boolean} A boolean if it worked or not
     * @memberof AutoCrystal
     * @private
     */
    breakCrystal() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.enabled)
                return false;
            yield this.bot.waitForTicks(this.tick);
            const crystal = this.bot.nearestEntity((entity) => entity.name === 'end_crystal');
            const damage = this.bot.getExplosionDamages(this.bot.entity, crystal.position, 6);
            if (crystal) {
                // check if safe mode is turned on
                if ((this.options.breakMode === 'safe' && damage > this.options.damageThreshold) ||
                    (this.options.breakMode === 'safe' && damage >= this.bot.health))
                    return false;
                yield this.bot.activateEntity(crystal);
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
                    if (!this.bot.heldItem || this.bot.heldItem.name !== crystal.name)
                        this.bot.equip(crystal, 'hand');
                    try {
                        yield this.bot.waitForTicks(this.options.delay);
                        yield this.placeCrystal(player.position);
                        yield this.breakCrystal();
                    }
                    catch (e) {
                        this.run = false;
                        console.error(e);
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
     * @returns {Promise<void>}
     * @memberof AutoCrystal
     */
    disable() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.started)
                return;
            this.enabled = false;
        });
    }
    /**
     * Enables the AutoCrystal
     * @async
     * @returns {Promise<void>}
     * @memberof AutoCrystal
     */
    enable() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.started)
                return;
            this.enabled = true;
        });
    }
}
exports.AutoCrystal = AutoCrystal;
