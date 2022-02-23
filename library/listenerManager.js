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