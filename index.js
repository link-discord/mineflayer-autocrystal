const sleep = require('sleep-promise')
const { Vec3 } = require('vec3')

module.exports.autoCrystal = function autoCrystal(bot) {
	let run = true
	let started = false

	const tick = 50

	async function placeCrystal(position) {
		position = new Vec3(Math.floor(position.x), Math.floor(position.y), Math.floor(position.z))

		let blocks = bot.findBlocks({
			point: bot.entity.position,
			maxDistance: 4,
			count: 50,
			matching: (block) => block.name === 'obsidian' || block.name === 'bedrock',
		})

		blocks = blocks.filter(
			(block) =>
				Math.round(block.distanceTo(position)) >= 1 &&
				Math.round(block.xzDistanceTo(position)) <= 10 &&
				Math.round(bot.entity.position.y) <= position.y &&
				Math.abs(Math.round(bot.entity.position.y) - Math.round(position.y)) <= 10 &&
				Math.abs(Math.round(bot.entity.position.y) - Math.round(position.y)) >= 1 &&
				bot.entity.position.xzDistanceTo(block) >= 1
		)

		blocks = blocks.filter((block) => bot.blockAt(block.offset(0, 1, 0)).name === 'air')

		const number = 0

		if (!blocks[number] || !bot.blockAt(blocks[number])) return [];

		if (
			(blocks && blocks.length > 1 && bot.blockAt(blocks[number]).name === 'obsidian') ||
			bot.blockAt(blocks[number]).name === 'bedrock'
		) {
			try {
				await bot.lookAt(blocks[number], true)
				await bot.placeBlock(bot.blockAt(blocks[number]), new Vec3(0, 1, 0))
			} catch (error) {
				bot.removeAllListeners(`blockUpdate:${blocks[number]}`)
			}

			return blocks[number]
		}
	}

	async function breakCrystal() {
		setTimeout(() => {
			const crystal = bot.nearestEntity((entity) => entity.name === 'end_crystal')
			if (crystal) {
				bot.attack(crystal)
				return true
			} else return false
		}, tick * 2)
	}

	async function getNearestPlayer() {
		const player = bot.nearestEntity(
			(entity) => entity.type === 'player' && entity.position.distanceTo(bot.entity.position) <= 10
		)
		if (player) return player
		else return null
	}

	async function getHoles() {
		let holes = []

		const blocks = bot.findBlocks({
			point: bot.entity.position,
			maxDistance: 10,
			count: 2000,
			matching: (block) => block.name === 'bedrock',
		})

		for (let index = 0; index < blocks.length; index++) {
			const block = blocks[index]

			if (
				bot.blockAt(block.offset(0, 1, 0)).name === 'air' &&
				bot.blockAt(block.offset(0, 2, 0)).name === 'air' &&
				bot.blockAt(block.offset(0, 3, 0)).name === 'air' &&
				bot.blockAt(block.offset(1, 1, 0)).name === 'bedrock' &&
				bot.blockAt(block.offset(0, 1, 1)).name === 'bedrock' &&
				bot.blockAt(block.offset(-1, 1, 0)).name === 'bedrock' &&
				bot.blockAt(block.offset(0, 1, -1)).name === 'bedrock'
			)
				holes.push(block)
		}

		return holes
	}

	async function enable() {
		if (started) return
		started = true

		while (run) {
			const player = await getNearestPlayer()
			const crystal = bot.inventory.items().find((item) => item.name === 'end_crystal')

			if (player && crystal && run) {
				if (!bot.heldItem || bot.heldItem.name !== crystal.name) bot.equip(crystal)
				try {
					await placeCrystal(player.position)
					await breakCrystal()
					await sleep(tick * 2)
				} catch (e) {
					console.error(e)
				}
			}
		}

		started = false
		run = true
	}

	function disable() {
		run = false
	}

	bot.autoCrystal = {}
	bot.autoCrystal.enable = enable
    bot.autoCrystal.disable = disable
    bot.autoCrystal.getHoles = getHoles
}