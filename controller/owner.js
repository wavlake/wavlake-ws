const log = require('loglevel')
const{ randomUUID } = require('crypto')
const lnd = require('../library/lnd')
const ownerManager = require('../library/ownerManager')
const encryption = require('../library/encryption')
const key_family = 128
const key_index = 3


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

  const ownerData = await lnd.initConnection(request.owner)
  // console.log(ownerData);
  let ln = new lnd.lnrpc.Lightning(`${ownerData.host}`, ownerData.credentials);
  // Create invoice record excluding r_hash, get record ID
  ln.getInfo({}, function(err, response) {
    if (err) {
      res.status(500).json(err)
    }
    else {
      // Update invoice with r_hash
      const lndResponse = response;
      res.status(200).json(response);
    }   
  })

});

// POST

exports.create = handleErrorAsync(async (req, res, next) => {

  const request = {
    ownerId: req.body.ownerId,
    serverType: req.body.serverType,
    config: JSON.stringify(req.body.config)
  }

  // console.log(request);

  // LND config: '{ version: <version>,
  //                host: <host>,
  //                macaroon: <macaroon_hex>,
  //                cert: <cert_hex> }'

  log.debug(`Creating owner ${request.ownerId} in owners table`);

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


// exports.delete = handleErrorAsync(async (req, res, next) => {



//   const request = {
//     owner: req.body.owner,
//     bucket: req.body.bucket,
//     cid: req.body.cid
//   }

//   log.debug(`Deleting track ${request.owner}:${request.cid} in tracks table`);

//   storage.deleteFromStorage(request.bucket, request.owner, request.cid)
//     .then(() => trackManager.deleteTrack(request.owner, request.cid))
//     .then((data) => res.status(200).json(data))
//     .catch((err) => log.error(err))

//   // Delete media from IPFS
//   // const unpin = await pinata.unpin(request.trackId)
//   //                       // Delete track record from db
//   //                       
//   //                       .then((result) => res.status(200).json(result))
//   //                       .catch((err) => log.error(err))

// });

