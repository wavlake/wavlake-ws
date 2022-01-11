const db = require('./db')
const lnd = require('./lnd')
const log = require('loglevel')
const{ randomUUID } = require('crypto')

// Create owner
async function createOwner(owner_id,
                           salt,
                           server_type,
                           config) {
    log.debug(`Adding owner ${owner_id} to owners table`);
    return db.knex('owners')
            .insert( { owner_id: owner_id,
                       salt: salt,
                       server_type: server_type,
                       config: config }, ['id'] )
            .then(data => {
                // console.log(data);
                return data[0]['id']
                })
            .catch(err => {
                console.log(err);
                return err
    })
}

// Get salt for owner
async function getOwnerInfo(owner_id) {
    log.debug(`Fetching owner ${owner_id} from owners table`);
    return db.knex('owners')
        .where( { owner_id: owner_id } )
        .first('salt', 'config')
        .then(data => {
            // console.log(data);
            return data;
        })
        .catch(err => {
            console.log(err);
            return err
    })
}


module.exports = {
    createOwner,
    getOwnerInfo
}