const mineflayer = require('mineflayer')
const { autoCrystal } = require('mineflayer-autocrystal')

const bot = mineflayer.createBot({
	host: 'localhost',
	username: 'AutoCrystal',
})

bot.loadPlugin(autoCrystal)

bot.once('spawn', () => {
    bot.chat('/gamemode creative')
    bot.chat('/give @s end_crystal 500')
})

bot.on('message', async (username, message) => {
	if (username === bot.username) return

	if (message === 'start') {
		console.log('AutoCrystal enabled.')
		bot.autoCrystal
	}

	else if (message === 'stop') {
		console.log('AutoCrystal disabled.')
		bot.autoCrystal.disable()
	}

	else if (message === 'holes') {
		const holes = await bot.autoCrystal.getHoles()
		console.log(`Found ${holes.length} holes made out of bedrock.`)
	}
})