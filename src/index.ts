import { AutoCrystal } from './AutoCrystal'
import { Bot } from 'mineflayer'

export function autoCrystal(bot: Bot) {
    // @ts-ignore
    bot.autoCrystal = new AutoCrystal(bot)
}

export { AutoCrystal } from './AutoCrystal'
