import { Bot } from 'mineflayer'
import { Entity } from 'prismarine-entity'
import { Vec3 } from 'vec3'
import { promisify } from 'util'

const sleep = promisify(setTimeout)

interface MineflayerBot extends Bot {
    getExplosionDamages(
        entity: Entity,
        position: Vec3,
        radius: number,
        rawDamages?: boolean
    ): number
}

interface DebugOptions {
    useTime?: boolean
    useTimeEnd?: boolean
}

interface Options {
    /**
     * See https://github.com/PrismarineJS/mineflayer/issues/2030.
     */
    ignoreInventoryCheck?: boolean
    /**
     * If set to true it will automatically equip an end crystal. default is `true`
     */
    autoEquip?: boolean
    /**
     * Emits the `error` event when an error occurs internally. default is `false`
     */
    logErrors?: boolean
    /**
     * Logs information about what AutoCrystal is up to. default is `false`
     */
    logDebug?: boolean
    /**
     * If the damage exceeds the threshold, it will not place / break the crystal. default is `5`
     */
    damageThreshold?: number
    /**
     * The delay in ticks between each crystal placement. default is `1`
     */
    delay?: number
    /**
     * What the bot should prefer when choosing where to place a crystal. default is `none`
     */
    priority?: 'none' | 'damage' | 'distance'
    /**
     * The mode to use for placing the crystal. can be `suicide` or `safe`
     */
    placeMode: 'suicide' | 'safe'
    /**
     * The mode used for breaking the crystal. default is `safe`
     */
    breakMode: 'suicide' | 'safe'
}

export class AutoCrystal {
    private run: boolean = true
    private started: boolean = false
    private enabled: boolean = false

    /**
     * Options for the `AutoCrystal` class.
     * @typedef {Object} Options
     * @property {boolean} [ignoreInventoryCheck=true] - See https://github.com/PrismarineJS/mineflayer/issues/2030.
     * @property {boolean} [autoEquip=true] - If set to true it will automatically equip an end crystal.
     * @property {boolean} [logDebug=false] - If the debug log should be emitted.
     * @property {boolean} [logErrors=false] - If errors should be logged.
     * @property {number} [damageThreshold=5] - If the damage exceeds the threshold, it will not place / break the crystal.
     * @property {string} [priority=distance] - What the bot should prefer when choosing where to place a crystal.
     * @property {number} [delay=1] - The delay in ticks between each crystal placement.
     * @property {string} placeMode - The mode to use for placing the crystal. can be `suicide` or `safe`
     * @property {string} breakMode - The mode to use for breaking the crystal. can be `suicide` or `safe`
     */

    /**
     * @param {Options} options
     * @param {Bot} bot
     */
    constructor(
        public bot: MineflayerBot,
        public options: Options = {
            autoEquip: true,
            ignoreInventoryCheck: true,
            logDebug: false,
            logErrors: false,
            priority: 'distance',
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
     * Emits the debug log event with the specified message.
     * @param {string} message The message to be emitted.
     * @param {Object} options The options for the debug method.
     * @returns {void}
     * @memberof AutoCrystal
     * @private
     */
    private debug(message: string, options?: DebugOptions): void {
        if (!this.options.logDebug) return
        if (!options) console.log(`[AutoCrystal] ${message}`)
        else if (options.useTime) console.time(`[AutoCrystal] ${message}`)
        else if (options.useTimeEnd) console.timeEnd(`[AutoCrystal] ${message}`)
    }

    /**
     * Shortcut for getting the damage for an entity.
     * @param {Entity} entity The entity to get the damage for.
     * @param {Vec3} position The position of the explosion.
     * @returns {number} The estimated damage the entity would recieve.
     * @memberof AutoCrystal
     * @private
     */ 
    private getDamage(entity: Entity, position: Vec3): number {
        return this.bot.getExplosionDamages(entity, position, 6, true)
    }

    /**
     * Finds the best position to place the crystal on to.
     * @async
     * @param {Vec3} position Vec3 position.
     * @returns {Vec3} The position to place the crystal on.
     * @memberof AutoCrystal
     * @private
     */
    private async findPosition(entity: Entity): Promise<Vec3 | null> {
        if (!this.enabled) return null

        const entity_position = new Vec3(
            Math.floor(entity.position.x),
            Math.floor(entity.position.y),
            Math.floor(entity.position.z)
        )

        let positions = this.bot.findBlocks({
            point: this.bot.entity.position,
            maxDistance: 4,
            count: 50,
            matching: (block) => block.name === 'obsidian' || block.name === 'bedrock'
        })

        positions = positions.filter(
            (block) =>
                Math.round(block.distanceTo(entity_position)) >= 1 &&
                Math.round(block.distanceTo(entity_position)) <= 8 &&
                Math.round(this.bot.entity.position.y) <= entity_position.y &&
                this.bot.entity.position.xzDistanceTo(block) >= 1
        )

        positions = positions.filter(
            (block) =>
                this.bot.blockAt(block.offset(0, 1, 0)).name === 'air' &&
                this.bot.blockAt(block.offset(0, 2, 0)).name === 'air'
        )

        if (
            this.options.placeMode === 'safe' &&
            this.bot.game.difficulty !== 'peaceful' &&
            this.bot.game.gameMode !== 'creative'
        ) {
            positions = positions.filter((pos) => {
                const damage = this.getDamage(this.bot.entity, pos.offset(0, 1, 0))
                return damage <= this.options.damageThreshold || damage < this.bot.health
            })
        }

        if (!positions || positions.length === 0) return null

        if (this.options.priority === 'distance') {
            positions = positions.sort((a, b) => {
                return a.distanceTo(entity_position) - b.distanceTo(entity_position)
            })

            return positions[0]
        }

        if (this.options.priority === 'damage') {
            const arr = positions.map((pos) => {
                return {
                    position: pos,
                    selfDamage: this.getDamage(this.bot.entity, pos.offset(0, 1, 0)),
                    enemyDamage: this.getDamage(entity, pos.offset(0, 1, 0))
                }
            })

            // check if there is an explosion that would kill the enemy
            const killPosition = arr.find((pos) => {
                return pos.enemyDamage >= entity.health
            })

            // use that position so the whole array doesn't have to be sorted
            if (killPosition) return killPosition.position

            let bestPositions = arr.sort(function (a, b) {
                return b.enemyDamage - b.selfDamage - (a.enemyDamage - a.selfDamage)
            })

            const bestPosition = bestPositions[0]
            return bestPosition.position
        }

        if (!this.options.priority || this.options.priority === 'none') {
            return positions[0]
        }

        return null
    }

    /**
     * Places the crystal on the specified position.
     * @async
     * @param {Vec3} position Vec3 position.
     * @returns {boolean} A boolean indicating if the crystal was placed.
     * @memberof AutoCrystal
     * @private
     */
    private async placeCrystal(position: Vec3): Promise<boolean> {
        let crystalPlaced = false

        const crystal = this.bot.nearestEntity((entity) => entity.name === 'end_crystal')

        if (!crystal || (crystal && Math.floor(crystal.position.distanceTo(position)) > 0)) {
            this.bot.lookAt(position, true, () => {
                this.bot.placeEntity(this.bot.blockAt(position), new Vec3(0, 1, 0))
            })

            crystalPlaced = true
        } else if (crystal && crystal.position.distanceTo(this.bot.entity.position) <= 4) {
            await this.breakCrystal(crystal)
        }

        return crystalPlaced
    }

    /**
     * Breaks the nearest crystal
     * @async
     * @param {Entity} entity The crystal to break.
     * @returns {boolean} A boolean indicating if the crystal was broken.
     * @memberof AutoCrystal
     * @private
     */
    private async breakCrystal(crystal?: Entity): Promise<boolean> {
        if (!this.enabled) return false

        if (!crystal) crystal = this.bot.nearestEntity((entity) => entity.name === 'end_crystal')

        if (crystal) {
            const damage = this.getDamage(this.bot.entity, crystal.position)

            if (
                this.options.breakMode === 'safe' &&
                this.bot.game.difficulty !== 'peaceful' &&
                this.bot.game.gameMode !== 'creative' &&
                (damage >= this.options.damageThreshold || damage > this.bot.health)
            ) {
                return false
            }

            await sleep(50 * 1)
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

        const player = this.bot.nearestEntity(
            (entity) =>
                entity.type === 'player' &&
                entity.position.distanceTo(this.bot.entity.position) <= 6
        )

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
        while (this.run) {
            const player = await this.getNearestPlayer()
            const crystal = this.bot.inventory.items().find((item) => item.name === 'end_crystal')

            if (player && crystal) {
                // we equip an end crystal to the main hand if we don't have one equipped
                if (!this.bot.heldItem || this.bot.heldItem.name !== crystal.name) {
                    const requiresConfirmation = this.bot.inventory.requiresConfirmation

                    if (this.options.ignoreInventoryCheck) {
                        this.bot.inventory.requiresConfirmation = false
                    }

                    this.bot.inventory.requiresConfirmation = requiresConfirmation

                    await this.bot.equip(crystal, 'hand')
                }

                try {
                    await sleep(50 * this.options.delay)

                    this.debug(`executing findPosition took`, {
                        useTime: true
                    })

                    const position = await this.findPosition(player)

                    this.debug(`executing findPosition took`, {
                        useTimeEnd: true
                    })

                    if (position) {
                        const placed = await this.placeCrystal(position)
                        if (placed) await this.breakCrystal()
                    }
                } catch (error) {
                    this.run = false
                    // @ts-ignore
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
     * @returns {boolean}
     * @memberof AutoCrystal
     */
    disable(): boolean {
        this.enabled = false
        return true
    }

    /**
     * Enables the AutoCrystal
     * @returns {boolean}
     * @memberof AutoCrystal
     */
    enable(): boolean {
        if (this.started) return false
        this.enabled = true
        return true
    }
}
