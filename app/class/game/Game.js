/**
 * @typedef {import("../../preload/theme").Themes} Themes
 * @typedef {import("../../preload/settings").Settings["appearance"]} Appearance
 */

const Player = require("./Player");
const { version } = require("../../../package.json");

class Game {
    /** @type {Themes} */
    theme;
    /** @type {Player[]} */
    players;
    /** @type {string[]} */
    ips;
    startState;
    startedOn;
    /** @type {string[]} */
    blacklist;
    hostIndex;

    /**
     * @constructor
     * @param {Themes} theme 
     */
    constructor() {
        this.theme = "";
        this.players = [null, null, null, null, null, null, null, null];
        this.ips = [null, null, null, null, null, null, null, null];
        this.startState = 0;
        this.startedOn = -6e9;
        this.blacklist = [];
    }

    /**
     * Let a player join the game.
     * @param {Appearance} appearance
     * @param {string} ip
     * @returns {number}
     */
    join(appearance, ip) {
        if (this.players[appearance.preferredColor] !== null) {
            let success = -1;
            for (let i=0; i<this.players.length; i++) {
                if (this.players[i] === null) {
                    this.players[i] = new Player(appearance, i);
                    this.ips[i] = ip;
                    success = i;
                    break;
                }
            }
            return success;
        } else {
            this.players[appearance.preferredColor] = new Player(appearance);
            this.ips[appearance.preferredColor] = ip;
            if (ip.includes("127.0.0.1")) this.hostIndex = appearance.preferredColor;
        }

        return appearance.preferredColor;
    }

    /**
     * Remove a player from the game. Note that this does not equal kicking, this game only has banning!
     * @param {number} index
     */
    remove(index) {
        if (this.players[index] !== null) this.players[index] = this.ips[index] = null;
    }

    /**
     * Ban a player from the game, based on his IP address.
     * @param {number} index
     */
    ban(index) {
        if (index === this.hostIndex) return;

        this.blacklist.push(this.ips[index]);
        this.remove(index);
    }

    /** Start the game. */
    start() {
        if (this.startState > 0) return;

        this.startState = 1;
        this.startedOn = new Date().getTime();
    }

    /** Update the game. */
    update() {
        const now = new Date().getTime();
        for (const p of this.players) {
            if (p === null) continue;
            p.update();
        }

        if (this.startState === 1 && now - this.startedOn >= 3000) this.startState = 2;
        else if (this.startState === 2 && now - this.startedOn >= 5000) this.startState = 3;
    }

    /** Export the game to clients. */
    export() {
        let connected = 0;
        for (const p of this.players) {
            if (p !== null) connected++;
        }

        return {
            act: "update",
            theme: this.theme,
            host: this.hostIndex,
            version,
            players: this.players,
            connected,
            startState: this.startState
        };
    }
}

module.exports = Game;
