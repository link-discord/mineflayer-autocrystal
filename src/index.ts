import { Bot } from 'mineflayer'
import { AutoCrystal } from './AutoCrystal'

export function autoCrystal(bot: Bot) {
	const autocrystal = new AutoCrystal(bot)

	// @ts-expect-error
	bot.autoCrystal = autocrystal
}