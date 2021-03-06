const axios = require('axios').default
const mineflayer = require('mineflayer')
const { autoCrystal } = require('../lib/index')

function cleanup(bot) {
    bot.chat('/gamemode survival')
    bot.chat('/fill -10 4 -10 10 30 10 minecraft:air')
    bot.chat('/kill @e[type=!minecraft:player]')
    console.log('Cleanup is complete.')
}

async function main() {
    const { data } = await axios.get(`${process.env.API}/minecraft`)

    const priority = process.env.PRIORITY ?? 'none'

    const bot1 = mineflayer.createBot({
        host: data.ip,
        port: data.port,
        username: 'bot1'
    })

    bot1.loadPlugin(autoCrystal)

    const bot2 = mineflayer.createBot({
        host: data.ip,
        port: data.port,
        username: 'bot2'
    })

    bot2.on('entitySpawn', (entity) => {
        const pos = entity.position

        if (entity.name === 'end_crystal') {
            console.log(`[Bot (2)] Crystal has been placed at x: ${pos.x} y: ${pos.y} z: ${pos.z}`)
        }
    })

    bot1.on('error', (error) => {
        console.error(error)
        process.exit(1)
    })

    bot2.on('error', (error) => {
        console.error(error)
        process.exit(1)
    })

    let playerDied = false
    let caEnabled = false

    bot2.on('death', () => {
        if (!caEnabled) return

        playerDied = true

        bot1.chat('Test has been succesful.')

        setTimeout(() => {
            cleanup(bot1)
        }, 200)

        setTimeout(() => {
            console.log('Test has passed.')
            process.exit(0)
        }, 800)
    })

    bot1.once('spawn', async () => {
        bot1.autoCrystal.options.logDebug = true
        bot1.autoCrystal.options.logErrors = true
        bot1.autoCrystal.options.priority = priority

        console.log('[Bot (1)] Bot has spawned')

        bot1.chat('/gamemode creative')

        setTimeout(() => {
            bot1.chat('/give @s minecraft:end_crystal 100')
            bot1.chat(`/fill 0 11 0 0 11 0 minecraft:bedrock`)
            bot1.chat(`/fill 2 11 0 4 11 0 minecraft:bedrock`)
            bot1.chat(`/fill 4 10 1 4 10 -1 minecraft:bedrock`)
            console.log('[Bot (1)] Platforms have been created.')
        }, 4 * 1000)

        setTimeout(() => {
            bot1.chat('/tp @s 0 12 0')
            console.log('[Bot (1)] Teleported to the platform.')
        }, 6 * 1000)

        setTimeout(() => {
            bot1.autoCrystal.enable()
            caEnabled = true
            console.log('[Bot (1)] Enabled the auto crystal.')
        }, 10 * 1000)

        setTimeout(() => {
            bot1.autoCrystal.disable()

            caEnabled = false

            if (!playerDied) {
                bot1.chat('Test has failed.')

                setTimeout(() => {
                    cleanup(bot1)
                }, 200)

                setTimeout(() => {
                    console.log('Test failed due to timeout.')
                    process.exit(1)
                }, 800)
            }
        }, 30 * 1000)
    })

    bot2.once('spawn', async () => {
        console.log('[Bot (2)] Bot has spawned.')

        bot2.chat('/gamemode creative')

        setTimeout(() => {
            bot2.chat('/gamemode survival')
            bot2.chat('/tp @s 4 12 0')
            console.log('[Bot (2)] Teleported to the platform and now in survival mode.')
        }, 8 * 1000)
    })
}

main()
