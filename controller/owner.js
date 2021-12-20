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

// POST

exports.create = handleErrorAsync(async (req, res, next) => {

  const request = {
    userId: req.body.userId,
    serverType: req.body.serverType,
    config: req.body.config
  }

  // LND config: '{ version: <version>,
  //                host: <host>,
  //                macaroon: <macaroon_hex>,
  //                cert: <cert_hex> }'

  log.debug(`Creating owner ${request.userId} in owners table`);

  const salt = randomUUID();
  const lndRequest = { 
    msg: Buffer.from(request.userId),
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
            ownerManager.createOwner( request.userId,
                                      salt,
                                      request.serverType,
                                      enc )
              .then((data) => res.status(200).json(data))
          })
      }
  })
});

exports.decrypt = handleErrorAsync(async (req, res, next) => {

  const request = {
    userId: req.body.userId,
  }

  const ownerData = await ownerManager.getOwnerInfo(request.userId);

  // console.log(ownerData)
  const lndRequest = { 
    msg: Buffer.from(request.userId),
    key_loc: { "key_family": key_family, 
               "key_index": key_index },
    double_hash: false,
    compact_sig: false
  };
  log.debug(`Decrypting config for ${request.userId}`);

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

