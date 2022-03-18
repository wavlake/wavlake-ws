const fs = require("fs");
const grpc = require('grpc')
const lnd = require('../library/lnd')
const log = require('loglevel')
const invoiceManager = require('../library/invoiceManager')
const ownerManager = require('../library/ownerManager')

const config = {
  macaroon: process.env.MACAROON_FUNDING,
  tls: process.env.TLS_PATH_FUNDING,
  lnd_host: process.env.LND_HOST_FUNDING,
  lnd_port: process.env.LND_PORT_FUNDING
}

const tunnelPort = process.env.HTTP_TUNNEL_PORT;
const tunnelHost = process.env.HTTP_TUNNEL_HOST;

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
exports.addFundingInvoice = handleErrorAsync(async (req, res, next) => {

  const uid = req.body['uid']
  const value = req.body['value']

  // Generate credentials
  const metadata = new grpc.Metadata()
  metadata.add('macaroon', config.macaroon)
  const macaroonCreds = grpc.credentials.createFromMetadataGenerator((_args, callback) => {
    callback(null, metadata);
  });

  // Combine credentials
  let lndCert = fs.readFileSync(config.tls);
  let sslCreds = grpc.credentials.createSsl(lndCert);
  let credentials = grpc.credentials.combineChannelCredentials(sslCreds, macaroonCreds);

  let ln = new lnd.lnrpc.Lightning(`${config.lnd_host}:${config.lnd_port}`, credentials);

  // Create invoice record excluding r_hash, get record ID
  invoiceManager.addFundingInvoice(value, uid)
    .then((data) => {
      const invoiceId = data;
      const request = { 
        value: value,
        memo: `Wavlake top-up (ID: ${data})`,
        expiry: 3600
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
          invoiceManager.updateListenerInvoiceHash(invoiceId, r_hash_str)
            .then(() => res.status(200).json(lndResponse))
          // res.json(response);
        }
        
    })
  })
})


exports.addInvoice = handleErrorAsync(async (req, res, next) => {

    const owner = req.body['owner']
    const title = req.body['title']
    const artist = req.body['artist']
    const cid = req.body['cid']
    const value = req.body['value']

    const ownerType = await ownerManager.getOwnerType(owner);
    
    let ownerData;
    let ln;
    let forward;
    // LND
    if (ownerType === 'lnd') {
      forward = false;
      ownerData = await lnd.initConnection(owner)

      if (ownerData.host.includes("onion")) {
        // console.log("hello");
        process.env.http_proxy = `http://${tunnelHost}:${tunnelPort}`;
      }
  
      ln = new lnd.lnrpc.Lightning(`${ownerData.host}`, ownerData.credentials);
    }
    // Lightning Address
    else if (ownerType === 'lnaddress') {
      forward = true;
      ln = lnd.lnClient;
    }

    // Create invoice record excluding r_hash, get record ID
    invoiceManager.addNewInvoice(owner, value, cid, forward)
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

exports.forwardPayment = handleErrorAsync(async (req, res, next) => {

  const owner = req.body.owner;
  const r_hash_str = req.body.r_hash_str;

  const data = await invoiceManager.forwardTip(owner, r_hash_str);
  // log.debug(data);
  res.json(data);
})

exports.lookupInvoice = handleErrorAsync(async (req, res, next) => {

    const owner = req.body.owner;
    const r_hash_str = req.body.r_hash_str;

    const request = { 
      r_hash: Buffer.from(req.body.r_hash_str, 'hex'),
    };

    const ownerType = await ownerManager.getOwnerType(owner);
    
    let ln;
    // LND
    if (ownerType === 'lnd') {
      ownerData = await lnd.initConnection(owner)

      if (ownerData.host.includes("onion")) {
        // console.log("hello");
        process.env.http_proxy = `http://${tunnelHost}:${tunnelPort}`;
      }
  
      ln = new lnd.lnrpc.Lightning(`${ownerData.host}`, ownerData.credentials);
    }
    // Lightning Address
    else if (ownerType === 'lnaddress') {
      ln = lnd.lnClient;
    }
  
    ln.lookupInvoice(request, function(err, response) {
        if (err) {
          res.json(err)
        }
        else if (response.settled === true) {
          invoiceManager.updateInvoiceSettled(r_hash_str)
            .then((update) => {
              // console.log(update);
              if (update && ownerType === 'lnaddress') {
                invoiceManager.forwardTip(owner, r_hash_str);
              }
    
              res.json(response)
            })
        }
        else {
          res.json(response);
        }
        
    })
})

exports.monitorInvoice = handleErrorAsync(async (req, res, next) => {

    const owner = req.body.owner;
    const r_hash_str = req.body.r_hash_str;

    const request = { 
      r_hash: Buffer.from(req.body.r_hash_str, 'hex'),
    };

    const ownerType = await ownerManager.getOwnerType(owner);

    let lninvoice;
    // LND
    if (ownerType === 'lnd') {
      const ownerData = await lnd.initConnection(owner)
      // console.log(ownerData);

      if (ownerData.host.includes("onion")) {
        // console.log("hello");
        process.env.http_proxy = `http://${tunnelHost}:${tunnelPort}`;
      }

      lninvoice = new lnd.invoicesrpc.Invoices(`${ownerData.host}`, ownerData.credentials);
      

    }
    // Lightning Address
    else if (ownerType === 'lnaddress') {
      lninvoice = lnd.invoicesClient;
    }

    let call = lninvoice.subscribeSingleInvoice(request);
    call.on('data', function(response) {
        // console.log(response)
        // A response was received from the server.
        if (response.settled === false) {
          console.log('awaiting payment')
        }
        else if (response.settled === true) {
          invoiceManager.updateInvoiceSettled(r_hash_str)
            .then((update) => {
              console.log(update);
              if (update && ownerType === 'lnaddress') {
                invoiceManager.forwardTip(owner, r_hash_str);
              }
    
              res.json(response)
            })
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
