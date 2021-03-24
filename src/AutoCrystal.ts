import sleep from 'sleep-promise'
import { Bot } from 'mineflayer'
import { Entity } from 'prismarine-entity'
import { Vec3 } from 'vec3'

export class AutoCrystal {
	private readonly bot: Bot
	private readonly tick: number = 50
	private run: boolean = true
	private started: boolean = false

	constructor(bot: Bot) {
		this.bot = bot
	}

	/**
     * Places a crystal close to the position if possible
	 * 
	 * @param Vec3 A Vec3 position.
     * 
     * @returns A boolean if it worked or not.
     */
	private async placeCrystal(position: Vec3): Promise<boolean> {
		position = new Vec3(Math.floor(position.x), Math.floor(position.y), Math.floor(position.z))

		let blocks = this.bot.findBlocks({
			point: this.bot.entity.position,
			maxDistance: 4,
			count: 50,
			matching: (block) => block.name === 'obsidian' || block.name === 'bedrock',
		})

		blocks = blocks.filter(
			(block) =>
				Math.round(block.distanceTo(position)) >= 1 &&
				Math.round(block.xzDistanceTo(position)) <= 10 &&
				Math.round(this.bot.entity.position.y) <= position.y &&
				Math.abs(Math.round(this.bot.entity.position.y) - Math.round(position.y)) <= 10 &&
				Math.abs(Math.round(this.bot.entity.position.y) - Math.round(position.y)) >= 1 &&
				this.bot.entity.position.xzDistanceTo(block) >= 1
		)

		blocks = blocks.filter((block) => this.bot.blockAt(block.offset(0, 1, 0)).name === 'air')

		const number = 0

		if (!blocks[number] || !this.bot.blockAt(blocks[number])) return null

		if (
			(blocks && blocks.length > 1 && this.bot.blockAt(blocks[number]).name === 'obsidian') ||
			this.bot.blockAt(blocks[number]).name === 'bedrock'
		) {
			try {
				await this.bot.lookAt(blocks[number], true)
				await this.bot.placeBlock(this.bot.blockAt(blocks[number]), new Vec3(0, 1, 0))
			} catch (error) {}

			return true
		}

        return false
	}

	/**
     * Breaks the nearest crystal
     * 
     * @returns A boolean if it worked or not
     */
	private async breakCrystal() {
		await sleep(this.tick * 2)
		const crystal = this.bot.nearestEntity((entity) => entity.name === 'end_crystal')

		if (crystal) {
			this.bot.attack(crystal)
			return true
		} else {
			return false
		}
	}

	/**
     * Gets the nearest player
     * 
     * @returns The nearest player entity object.
     */
	private async getNearestPlayer(): Promise<Entity> {
		const player = this.bot.nearestEntity(
			(entity) => entity.type === 'player' && entity.position.distanceTo(this.bot.entity.position) <= 10
		)

		if (player) return player
		else return null
	}

	/**
     * Gets holes near the bot.
     *
     * @returns An array of Vec3 positions
     */
	async getHoles() {
		let holes: Vec3[] = []

		const blocks = this.bot.findBlocks({
			point: this.bot.entity.position,
			maxDistance: 10,
			count: 2000,
			matching: (block) => block.name === 'bedrock',
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
     * Enables the AutoCrystal
     */
	async enable() {
		if (this.started) return
		this.started = true

		while (this.run) {
			const player = await this.getNearestPlayer()
			const crystal = this.bot.inventory.items().find((item) => item.name === 'end_crystal')

			if (player && crystal && this.run) {
				if (!this.bot.heldItem || this.bot.heldItem.name !== crystal.name) this.bot.equip(crystal, 'hand')

				try {
					await this.placeCrystal(player.position)
					await this.breakCrystal()
					await sleep(this.tick * 2)
				} catch (e) {
					console.error(e)
				}
			}
		}

		this.started = false
		this.run = true
	}

	/**
     * Disables the AutoCrystal
     */
	async disable() {
		this.run = false
	}
}