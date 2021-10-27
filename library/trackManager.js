const db = require('./db')
const log = require('loglevel')

// Check play meter
async function checkPlays(client, trackId) {
    return new Promise((resolve, reject) => {
        log.debug(`Checking plays remaining for ${client}:${trackId} in tracks table`);
        return db.knex('tracks')
        .where({ client: client, cid: trackId })
        .first(
            'cid', 
            'play_count', 
            'plays_remaining', 
            'msats_per_play')
        .then(data => {
            resolve(data)
            })
        .catch(err => {
            reject(err)
        })
    })
}

// Check play price
async function checkPrice(client, trackId) {
    return new Promise((resolve, reject) => {
        log.debug(`Checking price for ${client}:${trackId} in tracks table`);
        return db.knex('tracks')
                .where({ client: client, cid: trackId })
                .first('msats_per_play')
                .then(data => {
                    resolve(data)
                    })
                .catch(err => {
                    reject(err)
            })
    })
}

// Recharge play meter
async function createTrack(client, msatsPerPlay, audioFile) {
    return new Promise((resolve, reject) => {
        log.debug(`Recharging plays remaining for track ${client}:${trackId}`);
        return db.knex('tracks')
                .where({ client: client, cid: trackId })
                .increment({plays_remaining: increment})
                .then(data => {
                    resolve(data)
                    })
                .catch(err => {
                    reject(err)
                })
        })
}

// TODO: Raise error so plays remaining cannot go below 0
// Add to play count and subtract from plays remaining
async function markPlay(client, trackId, count) {
    return new Promise((resolve, reject) => {
        log.debug(`Adding to play count for track ${client}:${trackId}`);
        return db.knex('tracks')
                .where({ client: client, cid: trackId })
                .increment({play_count: count})
                .then(() => {
                    log.debug(`Subtracting from plays remaining for track ${client}:${trackId}`);
                    return db.knex('tracks')
                        .where({ client: client, cid: trackId })
                        .decrement({plays_remaining: count})
                        .update({
                            updated_at: db.knex.fn.now()
                          })
                        .then(data => {
                            resolve(data)
                        })
                        .catch(err => {
                            reject(err)
                        })
                })
                .catch(err => {
                    reject(err)
                })
        })
}

// Recharge play meter
async function rechargePlays(client, trackId, increment) {
    return new Promise((resolve, reject) => {
        log.debug(`Recharging plays remaining for track ${client}:${trackId}`);
        return db.knex('tracks')
                .where({ client: client, cid: trackId })
                .increment({plays_remaining: increment})
                .update({
                    updated_at: db.knex.fn.now()
                  })
                .then(data => {
                    resolve(data)
                    })
                .catch(err => {
                    reject(err)
                })
        })
}

module.exports = {
    checkPlays,
    checkPrice,
    createTrack,
    markPlay,
    rechargePlays,
}