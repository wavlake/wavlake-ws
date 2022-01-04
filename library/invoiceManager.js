const db = require('./db')
const lnd = require('./lnd')
const log = require('loglevel')
const date = require('./date')
const{ randomUUID } = require('crypto')

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

// Add new invoice to invoice table
async function addNewInvoice(owner,
                             value,
                             cid,
                             is_fee) {
    log.debug(`Adding new invoice for ${cid} to invoices table`);
    return db.knex('invoices')
            .insert( { owner: owner,
                       r_hash_str: randomUUID(),
                       price_msat: value * 1000,
                       settled: false,
                       cid: cid,
                       recharged: false,
                       is_fee: is_fee }, ['id'] )
            .then(data => {
                // console.log(data);
                return data[0]['id']
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


// // Check invoice status in lnd
async function checkStatus(r_hash_str) {

    const owner = await getOwnerFromInvoice(r_hash_str);

    const ownerData = await lnd.initConnection(owner)
    // console.log(ownerData);
    let ln = new lnd.lnrpc.Lightning(`${ownerData.host}`, ownerData.credentials);

    // Build request for lnd call
    const request = { 
        r_hash: Buffer.from(r_hash_str, 'hex'),
      };

    log.debug(`Checking status of ${r_hash_str} invoice in ${owner} lnd db`);
    return new Promise((resolve, reject) => {
        ln.lookupInvoice(request, (err, response) => {
            if (err) {
                reject(err);
            }
            else {
                resolve(response);
            }
        })
    })
}

// Get cid from invoice hash
async function getCidFromInvoice(r_hash_str) {
    log.debug(`Getting cid for ${r_hash_str} in invoices table`);
    return new Promise((resolve, reject) => {
        return db.knex('invoices')
                .where({ r_hash_str: r_hash_str })
                .first('cid')
                .then(data => {
                    resolve(data['cid'])
                })
                .catch(err => {
                        reject(err)
                })
            })
}

// Get owner from invoice hash
async function getOwnerFromInvoice(r_hash_str) {
    log.debug(`Getting owner for ${r_hash_str} in invoices table`);
    return new Promise((resolve, reject) => {
        return db.knex('invoices')
                .where({ r_hash_str: r_hash_str })
                .first('owner')
                .then(data => {
                    resolve(data['owner'])
                })
                .catch(err => {
                        reject(err)
                })
            })
}



// Add new hash to invoice table
async function markRecharged(r_hash_str) {
    log.debug(`Marking ${r_hash_str} invoice as used for recharging in invoices table`);
    return db.knex('invoices')
        .where({ r_hash_str: r_hash_str })
        .update( { recharged: true } )
        .then(data => {
            return data
        })
        .catch(err => {
            return err
        })
    }

// Update invoice hash in invoice table
async function updateInvoiceHash(invoiceId,
                                 r_hash_str) {
    log.debug(`Updating invoice hash ${invoiceId} in invoices table`);
    return db.knex('invoices')
        .where({ id: parseInt(invoiceId) })
        .update( { r_hash_str: r_hash_str, updated_at: db.knex.fn.now() } )
        .then(data => {
                return data
        })
        .catch(err => {
            return err
        })
}

// Update invoice settlement status
async function updateInvoiceSettled(r_hash_str) {
    log.debug(`Updating invoice ${r_hash_str} as settled in invoices table`);

    const dateString = date.get();
    let cid = ''
    let value = -1

    return db.knex.transaction((trx) => {
        return db.knex('invoices')
            .where({ r_hash_str: r_hash_str })
            .update( { settled: true }, ['cid', 'price_msat'] )
            .transacting(trx)
        .then((data) => {
            cid = data[0]['cid']
            value = data[0]['price_msat']
            log.debug(`Creating daily tips record for ${cid} in tips table`);
            return db.knex('tips')
                .insert({ cid: cid, date_utc: dateString })
                .onConflict(['cid', 'date_utc'])
                .ignore()
                .transacting(trx)
        })
        .then(() => {
            return db.knex('tracks')
            .where({ cid: cid })
            .increment({ total_msats_earned: value})
            .update({ updated_at: db.knex.fn.now()})       
            .transacting(trx)
        })
        .then(() => {
                return db.knex('tips')
                .where({ cid: cid, date_utc: dateString })
                .increment({ total_msats: value})
                .update({ updated_at: db.knex.fn.now()})       
                .transacting(trx)
        })
        .then(() => trx.commit)
        .then(() => { return 1 })
        .catch(trx.rollback)
    })

        // return db.knex('invoices')
        //     .where({ r_hash_str: r_hash_str })
        //     .update( { settled: true } )
        //     .then(data => {
        //         return data
        //     })
        //     .catch(err => {
        //         return err
        //     })
}

module.exports = {
    addHash,
    addNewInvoice,
    checkHash,
    checkStatus,
    getCidFromInvoice,
    markRecharged,
    updateInvoiceHash,
    updateInvoiceSettled
}