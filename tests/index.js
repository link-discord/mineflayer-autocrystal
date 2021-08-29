const axios = require('axios').default
const mineflayer = require('mineflayer')
const { autoCrystal } = require('../lib/index')

async function main() {
    const { data } = await axios.get(`${process.env.API}/minecraft`)

    console.log(data)

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

    bot1.on('error', (error) => {
        console.error(error)
        process.exit(1)
    })

    bot2.on('error', (error) => {
        console.error(error)
        process.exit(1)
    })

    let playerDied = false

    function handleDeath(entity) {
        if (entity.type !== 'player') return

        playerDied = true

        bot1.chat('/fill -10 4 -10 10 30 10 minecraft:air')

        console.log('Test passed.')
        process.exit(0)
    }

    bot1.once('entityDead', handleDeath)
    bot1.once('entityGone', handleDeath)

    bot1.once('spawn', async () => {
        bot1.autoCrystal.options.logErrors = true
        bot1.autoCrystal.options.placeMode = 'suicide'
        bot1.autoCrystal.options.breakMode = 'suicide'

        bot1.chat('/tp 0 4 0')

        setTimeout(() => {
            bot1.chat('/tp @s 0 4 0')
            bot1.chat('/give @s minecraft:end_crystal 100')
            bot1.chat('/fill 0 10 0 0 10 0 minecraft:bedrock')
            bot1.chat('/fill 2 10 0 2 10 0 minecraft:bedrock')
            bot1.chat('/fill 2 10 0 3 10 0 minecraft:bedrock')
            bot1.chat('/fill 3 10 0 4 10 0 minecraft:bedrock')
        }, 5 * 1000)

        setTimeout(() => {
            bot1.chat('/tp @s 0 11 0')
        }, 7 * 1000)

        setTimeout(() => {
            bot1.chat('/gamemode creative')
            bot1.autoCrystal.enable()
        }, 11 * 1000)

        setTimeout(() => {
            bot1.chat('/gamemode survival')
            bot1.autoCrystal.disable()

            if (!playerDied) {
                console.log('Test failed.')
                process.exit(1)
            }
        }, 21 * 1000)
    })

    bot2.once('spawn', async () => {
        setTimeout(() => {
            bot2.chat('/tp @s 4 11 0')
        }, 9 * 1000)
    })
}

main()