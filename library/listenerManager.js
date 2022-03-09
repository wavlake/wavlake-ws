const db = require('./db')
const lnd = require('./lnd')
const log = require('loglevel')


// Create owner
async function createListener(listener_id) {
    log.debug(`Adding listener ${listener_id} to listeners table`);
    return db.knex('listeners')
            .insert( { listener_id: listener_id }, ['id'] )
            .then(data => {
                // console.log(data);
                return data[0]['id']
                })
            .catch(err => {
                console.log(err);
                return err
    })
}

// Recharge balance
async function rechargeBalance(r_hash_str, uid) {
    log.debug(`Marking invoice hash  ${r_hash_str} as recharged in listener_invoices table`);
    return db.knex.transaction((trx) => {
        return db.knex('listener_invoices')
                 .where({ r_hash_str: r_hash_str })
                 .update( { recharged: true } )
            .then((data) => {
                value = data[0]['price_msat']
                log.debug(`Adding value of ${value} msats to ${uid} in listeners table`);
                return db.knex('listeners')
                         .where({ uid: uid })
                         .increment({ balance_msats: value} )
                         .update({
                          updated_at: db.knex.fn.now()
                         })
                         .transacting(trx)
        })
        .then(() => trx.commit)
        .then(() => { return 1 })
        .catch(trx.rollback)
    })
}

// // Delete owner
// async function deleteOwner(owner) {
//     return new Promise((resolve, reject) => {
//         log.debug(`Deleting owner ${owner}`);
//         return db.knex('owners')
//                 .where({ owner_id: owner })
//                 .del()
//                 .then(data => {
//                     log.debug(`Deleted owner ${owner}`);
//                     resolve(data)
//                     })
//                 .catch(err => {
//                     log.debug(`Error deleting owner: ${err}`);
//                     reject(err)
//                 })
//         })
// }

// // Get salt for owner
// async function getOwnerInfo(owner_id) {
//     log.debug(`Fetching owner ${owner_id} from owners table`);
//     return db.knex('owners')
//         .where( { owner_id: owner_id } )
//         .first('salt', 'config')
//         .then(data => {
//             // console.log(data);
//             return data;
//         })
//         .catch(err => {
//             console.log(err);
//             return err
//     })
// }


module.exports = {
    createListener,
}