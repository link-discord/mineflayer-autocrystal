const mineflayer = require('mineflayer')
const { autoCrystal } = require('../lib/index')

function main() {
    const bot = mineflayer.createBot({
        host: 'localhost',
        username: 'AutoCrystal'
    })

    bot.loadPlugin(autoCrystal)

    bot.once('spawn', () => {
        bot.autoCrystal.options.logErrors = true
        console.clear()
        console.log('Spawned.')
        bot.chat('/gamemode creative')
        bot.chat('/give @s end_crystal 500')
    })

    bot.on('end', () => {
        main()
    })

    bot.on('kicked', (reason) => {
        console.log(reason)
        main()
    })

    bot.on('error', (reason) => {
        console.error(reason)
        main()
    })

    bot.on('chat', async (username, message) => {
        if (username === bot.username) return

        switch (message) {
            case 'start':
                bot.chat('AutoCrystal enabled.')
                await bot.autoCrystal.enable()
                break

            case 'stop':
                bot.chat('AutoCrystal disabled.')
                await bot.autoCrystal.disable()
                break

            case 'holes':
                const holes = await bot.autoCrystal.getHoles()
                bot.chat(`Found ${holes.length} holes made out of bedrock.`)
                break

            default:
                break
        }
    })
}

main()
