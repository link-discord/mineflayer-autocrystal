import { Bot } from 'mineflayer'
import { Entity } from 'prismarine-entity'
import { Vec3 } from 'vec3'

interface MineflayerBot extends Bot {
    getExplosionDamages(entity: Entity, position: Vec3, raidus: number, rawDamages?: boolean): number
}

interface Options {
    ignoreInventoryCheck?: boolean
    logErrors?: boolean
    /**
     * If the damage exceeds the threshold, it will not place / break the crystal.
     */
    damageThreshold?: number
    /**
     * The delay in ticks between each crystal placement.
     */
    delay?: number
    placeMode: 'suicide' | 'safe'
    breakMode: 'suicide' | 'safe'
}

export class AutoCrystal {
    private run: boolean = true
    private started: boolean = false
    private enabled: boolean = false

    /**
     * Options for the `AutoCrystal` class.
     * @typedef {Object} Options
     * @property {boolean} [ignoreInventoryCheck=true] If the inventory check should be ignored.
     * @property {boolean} [logErrors=false] If errors should be logged.
     * @property {number} [damageThreshold=5] - If the damage exceeds the threshold, it will not place / break the crystal.
     * @property {number} [delay=1] - The delay in ticks between each crystal placement.
     * @property {string} placeMode - The mode used to place the crystal.
     * @property {string} breakMode - The mode used to break the crystal.
     */

    /**
     * @param {Options} options
     * @param {Bot} bot
     */
    constructor(
        public bot: MineflayerBot,
        public options: Options = {
            ignoreInventoryCheck: true,
            logErrors: false,
            placeMode: 'safe',
            breakMode: 'safe',
            damageThreshold: 5,
            delay: 1
        }
    ) {
        bot.on('physicsTick', () => {
            const player = this.getNearestPlayer()

            if (!this.enabled && this.started) this.stop()
            else if (player && !this.started && this.enabled) this.start()
            else if (!player && this.started && this.enabled) this.stop()
        })
    }

    /**
     * Places a crystal close to the position if possible
     * @async
     * @param {Vec3} position Vec3 position.
     * @returns {boolean} A boolean if it worked or not.
     * @memberof AutoCrystal
     * @private
     */
    private async placeCrystal(position: Vec3): Promise<boolean> {
        if (!this.enabled) return false

        position = new Vec3(Math.floor(position.x), Math.floor(position.y), Math.floor(position.z))

        let blocks = this.bot.findBlocks({
            point: this.bot.entity.position,
            maxDistance: 4,
            count: 50,
            matching: (block) => block.name === 'obsidian' || block.name === 'bedrock'
        })

        blocks = blocks.filter(
            (block) =>
                Math.round(block.distanceTo(position)) >= 1.3 &&
                Math.round(block.distanceTo(position)) <= 10 &&
                Math.round(this.bot.entity.position.y) <= position.y &&
                this.bot.entity.position.xzDistanceTo(block) >= 1.3
        )

        blocks = blocks.filter((block) => this.bot.blockAt(block.offset(0, 1, 0)).name === 'air')

        const block = blocks[0]

        if (!block || !this.bot.blockAt(block)) return null

        const damage = this.bot.getExplosionDamages(this.bot.entity, block.offset(0, 1, 0), 6, true)

        if ((blocks && blocks.length >= 1 && this.bot.blockAt(block).name === 'obsidian') || this.bot.blockAt(block).name === 'bedrock') {
            try {
                if (
                    this.options.placeMode === 'safe' &&
                    this.bot.game.difficulty !== 'peaceful' &&
                    (damage > this.options.damageThreshold || damage >= this.bot.health)
                ) {
                    return false
                }

                const crystal = this.bot.nearestEntity((entity) => entity.name === 'end_crystal')

                if (!crystal || crystal.position !== block.offset(0, 1, 0)) {
                    await this.bot.lookAt(block, true)
                    await this.bot.placeEntity(this.bot.blockAt(block), new Vec3(0, 1, 0))
                } else if (crystal.position.xzDistanceTo(this.bot.entity.position) < 4) {
                    await this.breakCrystal()
                }
            } catch (error) {
                if (this.options.logErrors) this.bot.emit('error', error)
            }

            return true
        }

        return false
    }

    /**
     * Breaks the nearest crystal
     * @async
     * @returns {boolean} A boolean if it worked or not
     * @memberof AutoCrystal
     * @private
     */
    private async breakCrystal(): Promise<boolean> {
        if (!this.enabled) return false

        const crystal = this.bot.nearestEntity((entity) => entity.name === 'end_crystal')

        if (crystal) {
            const damage = this.bot.getExplosionDamages(this.bot.entity, crystal.position, 6, true)

            if (
                this.options.breakMode === 'safe' &&
                this.bot.game.difficulty !== 'peaceful' &&
                (damage > this.options.damageThreshold || damage >= this.bot.health)
            ) {
                return false
            }

            await this.bot.waitForTicks(1)
            this.bot.attack(crystal)
            return true
        } else {
            return false
        }
    }

    /**
     * Gets the nearest player
     * @async
     * @returns {Player} The nearest player entity object.
     * @returns {null} If no player is found.
     * @memberof AutoCrystal
     * @private
     */
    private async getNearestPlayer(): Promise<Entity> {
        if (!this.enabled) return null

        const player = this.bot.nearestEntity((entity) => entity.type === 'player' && entity.position.distanceTo(this.bot.entity.position) <= 6)

        if (player) return player
        else return null
    }

    /**
     * Gets holes near the bot.
     * @async
     * @returns {Vec3[]} An array of Vec3 positions
     * @memberof AutoCrystal
     */
    async getHoles(): Promise<Vec3[]> {
        let holes: Vec3[] = []

        const blocks = this.bot.findBlocks({
            point: this.bot.entity.position,
            maxDistance: 10,
            count: 2000,
            matching: (block) => block.name === 'bedrock'
        })

        for (let index = 0; index < blocks.length; index++) {
            const block = blocks[index]

            if (
                this.bot.blockAt(block.offset(0, 1, 0)).name === 'air' &&
                this.bot.blockAt(block.offset(0, 2, 0)).name === 'air' &&
                this.bot.blockAt(block.offset(0, 3, 0)).name === 'air' &&
                this.bot.blockAt(block.offset(1, 1, 0)).name === 'bedrock' &&
                this.bot.blockAt(block.offset(0, 1, 1)).name === 'bedrock' &&
                this.bot.blockAt(block.offset(-1, 1, 0)).name === 'bedrock' &&
                this.bot.blockAt(block.offset(0, 1, -1)).name === 'bedrock'
            )
                holes.push(block)
        }

        return holes
    }

    /**
     * Starts the auto crystal
     * @async
     * @returns {Promise<void>}
     * @memberof AutoCrystal
     * @private
     */
    private async start(): Promise<void> {
        if (this.started || !this.enabled) return
        this.started = true

        // loop to start the auto crystal
        while (this.run && this.enabled) {
            const player = await this.getNearestPlayer()
            const crystal = this.bot.inventory.items().find((item) => item.name === 'end_crystal')

            if (player && crystal) {
                if (!this.bot.heldItem || this.bot.heldItem.name !== crystal.name) {
                    const requiresConfirmation = this.bot.inventory.requiresConfirmation

                    if (this.options.ignoreInventoryCheck) this.bot.inventory.requiresConfirmation = false

                    this.bot.inventory.requiresConfirmation = requiresConfirmation

                    await this.bot.equip(crystal, 'hand')
                }

                try {
                    await this.bot.waitForTicks(this.options.delay)
                    await this.placeCrystal(player.position)
                    await this.breakCrystal()
                } catch (error) {
                    this.run = false
                    if (this.options.logErrors) this.bot.emit('error', error)
                }
            } else {
                this.run = false
            }
        }

        this.started = false
        this.run = true
    }

    /**
     * Stops the auto crystal
     * @async
     * @returns {Promise<void>}
     * @memberof AutoCrystal
     * @private
     */
    private async stop(): Promise<void> {
        if (!this.enabled) return
        this.run = false
    }

    /**
     * Disables the AutoCrystal
     * @async
     * @returns {Promise<boolean>}
     * @memberof AutoCrystal
     */
    async disable(): Promise<boolean> {
        this.enabled = false
        return true
    }

    /**
     * Enables the AutoCrystal
     * @async
     * @returns {Promise<boolean>}
     * @memberof AutoCrystal
     */
    async enable(): Promise<boolean> {
        if (this.started) return false
        this.enabled = true
        return true
    }
}
