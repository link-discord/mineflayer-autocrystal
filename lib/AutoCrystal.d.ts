import { Bot } from 'mineflayer';
import { Entity } from 'prismarine-entity';
import { Vec3 } from 'vec3';
interface MineflayerBot extends Bot {
    getExplosionDamages(entity: Entity, position: Vec3, raidus: number, rawDamages?: boolean): number;
}
interface Options {
    ignoreInventoryCheck?: boolean;
    logErrors?: boolean;
    /**
     * If the damage exceeds the threshold, it will not place / break the crystal.
     */
    damageThreshold?: number;
    /**
     * The delay in ticks between each crystal placement.
     */
    delay?: number;
    placeMode: 'suicide' | 'safe';
    breakMode: 'suicide' | 'safe';
}
export declare class AutoCrystal {
    bot: MineflayerBot;
    options: Options;
    private run;
    private started;
    private enabled;
    /**
     * Options for the `AutoCrystal` class.
     * @typedef {Object} Options
     * @property {boolean} [ignoreInventoryCheck=true] If the inventory check should be ignored.
     * @property {boolean} [logErrors=false] If errors should be logged.
     * @property {number} [damageThreshold=5] - If the damage exceeds the threshold, it will not place / break the crystal.
     * @property {number} [delay=1] - The delay in ticks between each crystal placement.
     * @property {string} placeMode - The mode used to place the crystal.
     * @property {string} breakMode - The mode used to break the crystal.
     */
    /**
     * @param {Options} options
     * @param {Bot} bot
     */
    constructor(bot: MineflayerBot, options?: Options);
    /**
     * Places a crystal close to the position if possible
     * @async
     * @param {Vec3} position Vec3 position.
     * @returns {boolean} A boolean if it worked or not.
     * @memberof AutoCrystal
     * @private
     */
    private placeCrystal;
    /**
     * Breaks the nearest crystal
     * @async
     * @returns {boolean} A boolean if it worked or not
     * @memberof AutoCrystal
     * @private
     */
    private breakCrystal;
    /**
     * Gets the nearest player
     * @async
     * @returns {Player} The nearest player entity object.
     * @returns {null} If no player is found.
     * @memberof AutoCrystal
     * @private
     */
    private getNearestPlayer;
    /**
     * Gets holes near the bot.
     * @async
     * @returns {Vec3[]} An array of Vec3 positions
     * @memberof AutoCrystal
     */
    getHoles(): Promise<Vec3[]>;
    /**
     * Starts the auto crystal
     * @async
     * @returns {Promise<void>}
     * @memberof AutoCrystal
     * @private
     */
    private start;
    /**
     * Stops the auto crystal
     * @async
     * @returns {Promise<void>}
     * @memberof AutoCrystal
     * @private
     */
    private stop;
    /**
     * Disables the AutoCrystal
     * @async
     * @returns {Promise<boolean>}
     * @memberof AutoCrystal
     */
    disable(): Promise<boolean>;
    /**
     * Enables the AutoCrystal
     * @async
     * @returns {Promise<boolean>}
     * @memberof AutoCrystal
     */
    enable(): Promise<boolean>;
}
export {};
