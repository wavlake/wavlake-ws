const lnd = require('../library/lnd')
const log = require('loglevel')

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
    const request = { 
        value: req.body['value'],
        memo: req.body['trackId'] // MUST BE CID OF TRACK
      };
    
    console.log(request)

    lnd.client.addInvoice(request, function(err, response) {
        if (err) {
          res.json(err)
        }
        else {
          log.debug(`Generated invoice, r_hash: ${Buffer.from(response.r_hash).toString('hex')}`);
          res.json(response);
        }
        
    })
})

exports.lookupInvoice = handleErrorAsync(async (req, res, next) => {
    const request = { 
        r_hash: Buffer.from(req.body['r_hash_str'], 'hex'),
      };
    
    lnd.client.lookupInvoice(request, function(err, response) {
        if (err) {
          res.json(err)
        }
        else {
          res.json(response);
        }
        
    })
})

exports.monitorInvoice = handleErrorAsync(async (req, res, next) => {
    const request = { 
        r_hash: Buffer.from(req.body['r_hash_str'], 'hex'),
      };
    
    let call = lnd.invoices.subscribeSingleInvoice(request);
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
