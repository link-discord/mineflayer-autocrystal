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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AutoCrystal = void 0;
const sleep_promise_1 = __importDefault(require("sleep-promise"));
const vec3_1 = require("vec3");
class AutoCrystal {
    constructor(bot) {
        this.tick = 50;
        this.run = true;
        this.started = false;
        this.bot = bot;
    }
    /**
     * Places a crystal close to the position if possible
     *
     * @param Vec3 A Vec3 position.
     *
     * @returns A boolean if it worked or not.
     */
    placeCrystal(position) {
        return __awaiter(this, void 0, void 0, function* () {
            position = new vec3_1.Vec3(Math.floor(position.x), Math.floor(position.y), Math.floor(position.z));
            let blocks = this.bot.findBlocks({
                point: this.bot.entity.position,
                maxDistance: 4,
                count: 50,
                matching: (block) => block.name === 'obsidian' || block.name === 'bedrock',
            });
            blocks = blocks.filter((block) => Math.round(block.distanceTo(position)) >= 1 &&
                Math.round(block.xzDistanceTo(position)) <= 10 &&
                Math.round(this.bot.entity.position.y) <= position.y &&
                Math.abs(Math.round(this.bot.entity.position.y) - Math.round(position.y)) <= 10 &&
                Math.abs(Math.round(this.bot.entity.position.y) - Math.round(position.y)) >= 1 &&
                this.bot.entity.position.xzDistanceTo(block) >= 1);
            blocks = blocks.filter((block) => this.bot.blockAt(block.offset(0, 1, 0)).name === 'air');
            const number = 0;
            if (!blocks[number] || !this.bot.blockAt(blocks[number]))
                return null;
            if ((blocks && blocks.length > 1 && this.bot.blockAt(blocks[number]).name === 'obsidian') ||
                this.bot.blockAt(blocks[number]).name === 'bedrock') {
                try {
                    yield this.bot.lookAt(blocks[number], true);
                    yield this.bot.placeBlock(this.bot.blockAt(blocks[number]), new vec3_1.Vec3(0, 1, 0));
                }
                catch (error) { }
                return true;
            }
            return false;
        });
    }
    /**
     * Breaks the nearest crystal
     *
     * @returns A boolean if it worked or not
     */
    breakCrystal() {
        return __awaiter(this, void 0, void 0, function* () {
            yield sleep_promise_1.default(this.tick * 2);
            const crystal = this.bot.nearestEntity((entity) => entity.name === 'end_crystal');
            if (crystal) {
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
     *
     * @returns The nearest player entity object.
     */
    getNearestPlayer() {
        return __awaiter(this, void 0, void 0, function* () {
            const player = this.bot.nearestEntity((entity) => entity.type === 'player' && entity.position.distanceTo(this.bot.entity.position) <= 10);
            if (player)
                return player;
            else
                return null;
        });
    }
    /**
     * Gets holes near the bot.
     *
     * @returns An array of Vec3 positions
     */
    getHoles() {
        return __awaiter(this, void 0, void 0, function* () {
            let holes = [];
            const blocks = this.bot.findBlocks({
                point: this.bot.entity.position,
                maxDistance: 10,
                count: 2000,
                matching: (block) => block.name === 'bedrock',
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
     * Enables the AutoCrystal
     */
    enable() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.started)
                return;
            this.started = true;
            while (this.run) {
                const player = yield this.getNearestPlayer();
                const crystal = this.bot.inventory.items().find((item) => item.name === 'end_crystal');
                if (player && crystal && this.run) {
                    if (!this.bot.heldItem || this.bot.heldItem.name !== crystal.name)
                        this.bot.equip(crystal, 'hand');
                    try {
                        yield this.placeCrystal(player.position);
                        yield this.breakCrystal();
                        yield sleep_promise_1.default(this.tick * 2);
                    }
                    catch (e) {
                        console.error(e);
                    }
                }
            }
            this.started = false;
            this.run = true;
        });
    }
    /**
     * Disables the AutoCrystal
     */
    disable() {
        return __awaiter(this, void 0, void 0, function* () {
            this.run = false;
        });
    }
}
exports.AutoCrystal = AutoCrystal;
