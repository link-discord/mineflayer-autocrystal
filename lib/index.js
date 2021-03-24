"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AutoCrystal = exports.autoCrystal = void 0;
const AutoCrystal_1 = require("./AutoCrystal");
function autoCrystal(bot) {
    // @ts-ignore
    bot.autoCrystal = new AutoCrystal_1.AutoCrystal(bot);
}
exports.autoCrystal = autoCrystal;
var AutoCrystal_2 = require("./AutoCrystal");
Object.defineProperty(exports, "AutoCrystal", { enumerable: true, get: function () { return AutoCrystal_2.AutoCrystal; } });
