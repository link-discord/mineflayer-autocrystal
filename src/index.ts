import { AutoCrystal } from './AutoCrystal'
import { Bot } from 'mineflayer'

export function autoCrystal(bot: Bot) {
    // @ts-ignore
    bot.autoCrystal = new AutoCrystal(bot, {
        autoEquip: true,
        ignoreInventoryCheck: true,
        logDebug: false,
        logErrors: false,
        priority: 'distance',
        placeMode: 'safe',
        breakMode: 'safe',
        damageThreshold: 5,
        delay: 1
    })
}

export { AutoCrystal } from './AutoCrystal'
