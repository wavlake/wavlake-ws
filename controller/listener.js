const log = require('loglevel')
const{ randomUUID } = require('crypto')
const lnd = require('../library/lnd')
const listenerManager = require('../library/listenerManager')


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

// exports.getInfo = handleErrorAsync(async (req, res, next) => {

//   const request = { 
//     owner: req.query.ownerId,
//     serverType: req.query.serverType,
//   };

//   const ownerData = await lnd.initConnection(request.owner)
//   // console.log(ownerData);
//   // console.log(ownerData);
//   if (ownerData.host.includes("onion")) {
//     // console.log("hello");
//     process.env.http_proxy = `http://${tunnelHost}:${tunnelPort}`;
//   }

//   let ln = new lnd.lnrpc.Lightning(`${ownerData.host}`, ownerData.credentials);

//   ln.getInfo({}, function(err, response) {
//     if (err) {
//       // console.log(err);
//       res.status(500).json(err)
//     }
//     else {
//       // console.log(response);
//       res.status(200).json(response);
//     }   
//   })

// });

// POST

exports.create = handleErrorAsync(async (req, res, next) => {

  const request = {
    listenerId: req.body.listenerId,
  }

  log.debug(`Creating listener ${request.listenerId} in listeners table`);

  listenerManager.createListener(request.listenerId)
    .then((data) => res.status(200).json(data))

});

// exports.delete = handleErrorAsync(async (req, res, next) => {

//   const request = {
//     ownerId: req.body.ownerId,
//   }

//   // console.log(request);

//   // LND config: '{ version: <version>,
//   //                host: <host>,
//   //                macaroon: <macaroon_hex>,
//   //                cert: <cert_hex> }'

//   log.debug(`Deleting owner ${request.ownerId} from owners table`);

//   ownerManager.deleteOwner(request.ownerId)
//     .then((data) => res.status(200).json(data))

// });

// exports.decrypt = handleErrorAsync(async (req, res, next) => {

//   const request = {
//     ownerId: req.body.ownerId,
//   }

//   const ownerData = await ownerManager.getOwnerInfo(request.ownerId);

//   // console.log(ownerData)
//   const lndRequest = { 
//     msg: Buffer.from(request.ownerId),
//     key_loc: { "key_family": key_family, 
//                "key_index": key_index },
//     double_hash: false,
//     compact_sig: false
//   };
//   log.debug(`Decrypting config for ${request.ownerId}`);

//   lnd.signer.signMessage(lndRequest, function(err, response) {
//     if (err) {
//       res.json(err)
//     }
//     else {
//       const signature = Buffer.from(response['signature']).toString('hex');
//       encryption.decryptString(ownerData.config, signature, ownerData['salt'])
//             .then((data) => { res.status(200).json(data) })
//     }
// })

// });

