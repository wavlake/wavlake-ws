const log = require('loglevel')
const{ randomUUID } = require('crypto')
const lnd = require('../library/lnd')
const ownerManager = require('../library/ownerManager')
const address = require('../library/address')
const encryption = require('../library/encryption')
const key_family = 128
const key_index = 3

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

// GET

exports.getInfo = handleErrorAsync(async (req, res, next) => {

  
  const request = { 
    owner: req.query.ownerId,
    serverType: req.query.serverType,
  };

  log.debug(`Get info for ${request.owner}`);
  // LND
  if (req.query.serverType === 'lnd') {

    const ownerData = await lnd.initConnection(request.owner)

    if (ownerData.host.includes("onion")) {
      process.env.http_proxy = `http://${tunnelHost}:${tunnelPort}`;
    }
  
    let ln = new lnd.lnrpc.Lightning(`${ownerData.host}`, ownerData.credentials);
  
    ln.getInfo({}, function(err, response) {
      if (err) {
        // console.log(err);
        res.status(500).json(err)
      }
      else {
        // console.log(response);
        res.status(200).json(response);
      }   
    })
  }

   // Lightning Address
  else if (req.query.serverType === 'lnaddress') {
    ownerManager.getOwnerAddress(request.owner)
      .then((result) => address.init(result.config)
        .then((url) => address.requestInvoice(url, 1000)
          .then((pr) => {
            // console.log(pr);
            lnd.lnClient.decodePayReq({pay_req: pr}, function(err, response) {
              if (err) {
                console.log(err);
                res.status(500).json(err)
              }
              else {
                console.log(response);
                res.status(200).json(response);
              }   
            });
          })
        )
      )
  }

});

// POST

exports.create = handleErrorAsync(async (req, res, next) => {

  let request;

  // LND
  if (req.body.serverType === 'lnd') {
    const tlsHex = Buffer.from(req.files.filename.data).toString('hex')
    // console.log(tlsHex);
  
    request = {
      ownerId: req.body.ownerId,
      serverType: req.body.serverType,
      config: JSON.stringify( { host: `${req.body.host}:${req.body.port}`,
                                macaroon: req.body.macaroon,
                                cert: tlsHex })
    }
  
    log.debug(`Creating LND owner ${request.ownerId} in owners table`);

    const salt = randomUUID();
    const lndRequest = { 
      msg: Buffer.from(request.ownerId),
      key_loc: { "key_family": key_family, 
                "key_index": key_index },
      double_hash: false,
      compact_sig: false
    };

    lnd.signer.signMessage(lndRequest, function(err, response) {
        if (err) {
          res.json(err)
        }
        else {
          const signature = Buffer.from(response['signature']).toString('hex');
          encryption.encryptString(request.config, signature, salt)
            .then((enc) => {
              ownerManager.createOwner( request.ownerId,
                                        salt,
                                        request.serverType,
                                        enc )
                .then((data) => res.status(200).json(data))
            })
        }
    })
  }

  // Lightning Address
  else if (req.body.serverType === 'lnaddress') {
    request = {
      ownerId: req.body.ownerId,
      serverType: req.body.serverType,
      address: `${req.body.address}`
    }
  
    log.debug(`Creating Lightning Address owner ${request.ownerId} in owners table`);

    ownerManager.createOwner( request.ownerId,
                              "lnaddress",
                              request.serverType,
                              request.address)
      .then((data) => res.status(200).json(data))
  }

  // console.log(request);


});

exports.delete = handleErrorAsync(async (req, res, next) => {

  const request = {
    ownerId: req.body.ownerId,
  }

  // console.log(request);

  // LND config: '{ version: <version>,
  //                host: <host>,
  //                macaroon: <macaroon_hex>,
  //                cert: <cert_hex> }'

  log.debug(`Deleting owner ${request.ownerId} from owners table`);

  ownerManager.deleteOwner(request.ownerId)
    .then((data) => res.status(200).json(data))

});

exports.decrypt = handleErrorAsync(async (req, res, next) => {

  const request = {
    ownerId: req.body.ownerId,
  }

  const ownerData = await ownerManager.getOwnerInfo(request.ownerId);

  // console.log(ownerData)
  const lndRequest = { 
    msg: Buffer.from(request.ownerId),
    key_loc: { "key_family": key_family, 
               "key_index": key_index },
    double_hash: false,
    compact_sig: false
  };
  log.debug(`Decrypting config for ${request.ownerId}`);

  lnd.signer.signMessage(lndRequest, function(err, response) {
    if (err) {
      res.json(err)
    }
    else {
      const signature = Buffer.from(response['signature']).toString('hex');
      encryption.decryptString(ownerData.config, signature, ownerData['salt'])
            .then((data) => { res.status(200).json(data) })
    }
})

});

