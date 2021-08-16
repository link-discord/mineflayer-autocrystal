import { Bot } from 'mineflayer';
import { Entity } from 'prismarine-entity';
import { Vec3 } from 'vec3';
interface MineflayerBot extends Bot {
    getExplosionDamages(entity: Entity, position: Vec3, raidus: number, rawDamages?: boolean): number;
}
interface Options {
    /**
     *  If the damage the bot would recieve is higher than this number,
     *  it will not place / break the crystal depending on the modes that are set.
     */
    damageThreshold: number;
    /**
     * The delay in ticks between each check for the crystal.
     */
    delay: number;
    placeMode: 'suicide' | 'safe';
    breakMode: 'suicide' | 'safe';
}
export declare class AutoCrystal {
    bot: MineflayerBot;
    options: Options;
    private readonly tick;
    private run;
    private started;
    private enabled;
    /**
     * @param {Options} options
     * @param {Bot} bot
     */
    constructor(bot: MineflayerBot, options?: Options);
    /**
     * Places a crystal close to the position if possible
     * @async
     * @param {Vec3} A Vec3 position.
     * @returns {Boolean} A boolean if it worked or not.
     * @memberof AutoCrystal
     * @private
     */
    private placeCrystal;
    /**
     * Breaks the nearest crystal
     * @async
     * @returns {Boolean} A boolean if it worked or not
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
     * @returns {Promise<void>}
     * @memberof AutoCrystal
     */
    disable(): Promise<void>;
    /**
     * Enables the AutoCrystal
     * @async
     * @returns {Promise<void>}
     * @memberof AutoCrystal
     */
    enable(): Promise<void>;
}
export {};
