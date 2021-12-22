const db = require('./db')
const lnd = require('./lnd')
const log = require('loglevel')
const{ randomUUID } = require('crypto')

// Create owner
async function createOwner(user_id,
                           salt,
                           server_type,
                           config) {
    log.debug(`Adding owner ${user_id} to owners table`);
    return db.knex('owners')
            .insert( { user_id: user_id,
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
async function getOwnerInfo(user_id) {
    log.debug(`Fetching owner ${user_id} from owners table`);
    return db.knex('owners')
        .where( { user_id: user_id } )
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