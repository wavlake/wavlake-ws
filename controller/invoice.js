const lnd = require('../library/lnd')
const log = require('loglevel')
const invoiceManager = require('../library/invoiceManager')

// Error handling
// Ref: https://stackoverflow.com/questions/43356705/node-js-express-error-handling-middleware-with-router
const handleErrorAsync = (fn) => async (req, res, next) => {
  try {
      await fn(req, res, next);
  } catch (error) {
      next(error);
  }
};


// METHODS
exports.addInvoice = handleErrorAsync(async (req, res, next) => {

    const owner = req.body['owner']
    const title = req.body['title']
    const artist = req.body['artist']
    const cid = req.body['cid']
    const value = req.body['value']
    const is_fee = false // TODO: Implement fee collection logic

    const ownerData = await lnd.initConnection(owner)
    // console.log(ownerData);
    let ln = new lnd.lnrpc.Lightning(`${ownerData.host}`, ownerData.credentials);
    // Create invoice record excluding r_hash, get record ID
    invoiceManager.addNewInvoice(owner, value, cid, is_fee)
      .then((data) => {
        const invoiceId = data;
        const request = { 
          value: value,
          memo: `Wavlake: ${title} by ${artist} (ID: ${data})`,
          expiry: 180
        };
            // Generate invoice
        ln.addInvoice(request, function(err, response) {
          if (err) {
            res.json(err)
          }
          else {
            // Update invoice with r_hash
            const lndResponse = response;
            const r_hash_str = Buffer.from(response.r_hash).toString('hex')
            log.debug(`Generated invoice, r_hash: ${r_hash_str}`);
            invoiceManager.updateInvoiceHash(invoiceId, r_hash_str)
              .then(() => res.status(200).json(lndResponse))
            // res.json(response);
          }
          
      })
    })
})

exports.lookupInvoice = handleErrorAsync(async (req, res, next) => {

    const owner = req.body.owner;

    const request = { 
      r_hash: Buffer.from(req.body['r_hash_str'], 'hex'),
    };
    
    const ownerData = await lnd.initConnection(owner)
    // console.log(ownerData);
    let ln = new lnd.lnrpc.Lightning(`${ownerData.host}`, ownerData.credentials);
  
    ln.lookupInvoice(request, function(err, response) {
        if (err) {
          res.json(err)
        }
        else {
          res.json(response);
        }
        
    })
})

exports.monitorInvoice = handleErrorAsync(async (req, res, next) => {

    const owner = req.body.owner;

    const request = { 
      r_hash: Buffer.from(req.body['r_hash_str'], 'hex'),
    };

    const ownerData = await lnd.initConnection(owner)
    // console.log(ownerData);
    let lninvoice = new lnd.invoicesrpc.Invoices(`${ownerData.host}`, ownerData.credentials);
    
    let call = lninvoice.subscribeSingleInvoice(request);
    call.on('data', function(response) {
        // console.log(response)
        // A response was received from the server.
        if (response.settled === false) {
            console.log('awaiting payment')
        }
        else if (response.settled === true) {
            res.json(response)
        }
    });
    call.on('status', function(status) {
        // The current status of the stream.
    });
    call.on('end', function() {
        // The server has closed the stream.
        console.log('connection closed')
    });
})
