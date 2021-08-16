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
    constructor(bot: MineflayerBot, options?: Options);
    /**
     * Places a crystal close to the position if possible
     *
     * @param Vec3 A Vec3 position.
     *
     * @returns A boolean if it worked or not.
     */
    private placeCrystal;
    /**
     * Breaks the nearest crystal
     *
     * @returns A boolean if it worked or not
     */
    private breakCrystal;
    /**
     * Gets the nearest player
     *
     * @returns The nearest player entity object.
     */
    private getNearestPlayer;
    /**
     * Gets holes near the bot.
     *
     * @returns An array of Vec3 positions
     */
    getHoles(): Promise<Vec3[]>;
    private start;
    private stop;
    /**
     * Disables the AutoCrystal
     */
    disable(): Promise<void>;
    /**
     * Enables the AutoCrystal
     */
    enable(): Promise<void>;
}
export {};
