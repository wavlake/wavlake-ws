const db = require('./db')
const lnd = require('./lnd')
const log = require('loglevel')

// Add new hash to invoice table
async function addHash(r_hash_str,
                       price_msat,
                       settled,
                       cid) {
    log.debug(`Adding hash ${r_hash_str} to invoices table`);
    return db.knex('invoices')
            .insert( { r_hash_str: r_hash_str,
                       price_msat: price_msat,
                       settled: settled,
                       cid: cid,
                       recharged: false } )
            .then(data => {
                return data
                })
            .catch(err => {
                return err
    })
}


// Check hash in invoice table
async function checkHash(r_hash_str) {
    log.debug(`Checking hash ${r_hash_str} exists in invoices table`);
    return db.knex('invoices')
            .where('r_hash_str', '=', r_hash_str)
            .then(data => {
                return data
                })
            .catch(err => {
                return err
    })
}


// Check invoice status in lnd
async function checkStatus(r_hash_str) {
    const request = { 
        r_hash: Buffer.from(r_hash_str, 'hex'),
      };

    log.debug(`Checking status of ${r_hash_str} invoice in lnd db`);
    return new Promise((resolve, reject) => {
        lnd.client.lookupInvoice(request, (err, response) => {
            if (err) {
                reject(err);
            }
            else {
                resolve(response);
            }
        })
    })
}

// Add new hash to invoice table
async function markRecharged(r_hash_str) {
    log.debug(`Marking ${r_hash_str} invoice as used for recharging in invoices table`);
    return db.knex('invoices')
        .where('r_hash_str', '=', r_hash_str)
        .update( { recharged: true } )
        .then(data => {
            return data
        })
        .catch(err => {
            return err
        })
    }

module.exports = {
    addHash,
    checkHash,
    checkStatus,
    markRecharged
}