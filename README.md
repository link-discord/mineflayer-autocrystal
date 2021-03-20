<h1 align="center">Welcome to mineflayer-autocrystal 👋</h1>
<p>
  <a href="https://www.npmjs.com/package/mineflayer-autocrystal" target="_blank">
    <img alt="Version" src="https://img.shields.io/npm/v/mineflayer-autocrystal.svg">
  </a>
  <a href="https://github.com/LINKdiscordd/mineflayer-autocrystal#readme" target="_blank">
    <img alt="Documentation" src="https://img.shields.io/badge/documentation-yes-brightgreen.svg" />
  </a>
  <a href="https://github.com/LINKdiscordd/mineflayer-autocrystal/graphs/commit-activity" target="_blank">
    <img alt="Maintenance" src="https://img.shields.io/badge/Maintained%3F-yes-green.svg" />
  </a>
  <a href="https://github.com/LINKdiscordd/mineflayer-autocrystal/blob/master/LICENSE" target="_blank">
    <img alt="License: ISC" src="https://img.shields.io/github/license/LINKdiscordd/mineflayer-autocrystal" />
  </a>
</p>

> mineflayer-autocrystal is a plugin that lets mineflayer bots automatically place and destroy end crystals.

### 🏠 [Homepage](https://github.com/LINKdiscordd/mineflayer-autocrystal)

## Install

```sh
npm install mineflayer-autocrystal
```

## Example

```js
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
		bot.autoCrystal.enable()
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
```

## Author

👤 **Link#0069**

* Github: [@LINKdiscordd](https://github.com/LINKdiscordd)

## 🤝 Contributing

Contributions, issues and feature requests are welcome!<br />Feel free to check [issues page](https://github.com/LINKdiscordd/mineflayer-autocrystal/issues). 

## Show your support

Give a ⭐️ if this project helped you!

## 📝 License

Copyright © 2021 [Link#0069](https://github.com/LINKdiscordd).<br />
This project is [ISC](https://github.com/LINKdiscordd/mineflayer-autocrystal/blob/master/LICENSE) licensed.

***
_This README was generated with ❤️ by [readme-md-generator](https://github.com/kefranabg/readme-md-generator)_
