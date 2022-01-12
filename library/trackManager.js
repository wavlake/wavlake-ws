const db = require('./db')
const log = require('loglevel');
const date = require('./date')

// Check play meter
async function checkPlays(cid) {
    return new Promise((resolve, reject) => {
        log.debug(`Checking plays remaining for ${cid} in tracks table`);
        return db.knex('tracks')
        .where({ cid: cid })
        .first(
            'cid', 
            'play_count', 
            'plays_remaining', 
            'msats_per_play',
            'total_msats_earned')
        .then(data => {
            resolve(data)
            })
        .catch(err => {
            reject(err)
        })
    })
}

// Check play price
async function checkPrice(cid) {
    return new Promise((resolve, reject) => {
        log.debug(`Checking price for ${cid} in tracks table`);
        return db.knex('tracks')
            .where({ cid: cid })
            .first('msats_per_play')
            .then(res => {
                resolve(res)
                })
            .catch(err => {
                reject(err)
        })
    })

}

// Create new track
async function createTrack(owner, bucket, trackId, initPlaysRemaining, msatsPerPlay, title, artist) {
    return new Promise((resolve, reject) => {
        log.debug(`Creating new track ${owner}:${trackId}`);
        return db.knex('tracks')
                .insert({ owner: owner, 
                          bucket: bucket,
                          cid: trackId,
                          play_count: 0,
                          plays_remaining: parseInt(initPlaysRemaining),
                          msats_per_play: parseInt(msatsPerPlay),
                          title: title,
                          artist: artist },  ['id'] )
                .then(data => {
                    log.debug(`Created new track ${owner}:${trackId}, id: ${data[0]['id']}`);
                    resolve(data)
                    })
                .catch(err => {
                    log.debug(`Error creating new track: ${err}`);
                    reject(err)
                })
        })
}

// Delete track
async function deleteTrack(owner, cid) {
    return new Promise((resolve, reject) => {
        log.debug(`Deleting track ${owner}:${cid}`);
        return db.knex('tracks')
                .where({ cid: cid })
                .del([ 'owner',
                       'bucket',
                       'cid',
                       'play_count',
                       'plays_remaining',
                       'msats_per_play',
                       'total_msats_earned',
                       'updated_at',
                       'title',
                       'artist' ])
                .then(deleted => {
                    log.debug(`Archiving track history for ${owner}:${cid}`);
                    return db.knex('tracks_history')
                        .insert({ owner: deleted[0].owner, 
                                  bucket: deleted[0].bucket,
                                  cid: deleted[0].cid,
                                  play_count: deleted[0].play_count,
                                  plays_remaining: deleted[0].plays_remaining,
                                  msats_per_play: deleted[0].msats_per_play,
                                  total_msats_earned: deleted[0].total_msats_earned,
                                  updated_at: deleted[0].updated_at,
                                  title: deleted[0].title,
                                  artist: deleted[0].artist })
                })
                .then(data => {
                    log.debug(`Deleted track ${owner}:${cid}`);
                    resolve(data)
                    })
                .catch(err => {
                    log.debug(`Error deleting track: ${err}`);
                    reject(err)
                })
        })
}

// TODO: Raise error so plays remaining cannot go below 0
// Add to play count and subtract from plays remaining
async function markPlay(cid, count) {
    // return new Promise((resolve, reject, trx) => {
        log.debug(`Adding to play count and subtracing from plays remaining for track ${cid}`);

        const dateString = date.get();
        
        return db.knex.transaction((trx) => {
            return db.knex('tracks')
                .where({ cid: cid })
                .increment({play_count: count})
                .where({ cid: cid })
                .decrement({plays_remaining: count})
                .transacting(trx)
            .then(() => {
                log.debug(`Creating daily play record for ${cid}`);
                return db.knex('plays')
                    .insert({ cid: cid, date_utc: dateString })
                    .onConflict(['cid', 'date_utc'])
                    .ignore()
                    .transacting(trx)
            })
            .then(() => {
                return db.knex('plays')
                    .where({ cid: cid, date_utc: dateString })
                    .increment({ play_count: count})
                    .update({ updated_at: db.knex.fn.now()})
                    .transacting(trx)
            })           
            .then(() => trx.commit)
            .then(() => { return 1 })
            .catch(trx.rollback)
        })

        // return db.knex('tracks')
        //         .where({ cid: cid })
        //         .increment({play_count: count})
        //         .then(() => {
        //             log.debug(`Subtracting from plays remaining for track ${cid}`);
        //             return db.knex('tracks')
        //                 .where({ cid: cid })
        //                 .decrement({plays_remaining: count})
        //                 .update({
        //                     updated_at: db.knex.fn.now()
        //                   })
        //                 .then(data => {
        //                     resolve(data)
        //                 })
        //                 .catch(err => {
        //                     reject(err)
        //                 })
        //         })
        //         .catch(err => {
        //             reject(err)
        //         })
        // })
}

// Recharge play meter
async function rechargePlays(cid, increment) {
    return new Promise((resolve, reject) => {
        log.debug(`Recharging plays remaining for track ${cid}`);
        return db.knex('tracks')
                .where({ cid: cid })
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
    deleteTrack,
    markPlay,
    rechargePlays,
}