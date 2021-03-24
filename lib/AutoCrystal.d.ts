import { Bot } from 'mineflayer';
import { Vec3 } from 'vec3';
export declare class AutoCrystal {
    private readonly bot;
    private readonly tick;
    private run;
    private started;
    private enabled;
    constructor(bot: Bot);
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
