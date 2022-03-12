const fs = require("fs");
const grpc = require('grpc')
const lnd = require('../library/lnd')
const log = require('loglevel')
const invoiceManager = require('../library/invoiceManager')
const listenerManager = require('../library/listenerManager')
const { db } = require('../library/fstore')

const config = {
  macaroon: process.env.MACAROON_FUNDING,
  tls: process.env.TLS_PATH_FUNDING,
  lnd_host: process.env.LND_HOST_FUNDING,
  lnd_port: process.env.LND_PORT_FUNDING
}

// Generate credentials
const metadata = new grpc.Metadata()
metadata.add('macaroon', config.macaroon)
const macaroonCreds = grpc.credentials.createFromMetadataGenerator((_args, callback) => {
  callback(null, metadata);
});
// Combine credentials
const lndCert = fs.readFileSync(config.tls);
const sslCreds = grpc.credentials.createSsl(lndCert);
const credentials = grpc.credentials.combineChannelCredentials(sslCreds, macaroonCreds);

const funding_ln = new lnd.lnrpc.Lightning(`${config.lnd_host}:${config.lnd_port}`, credentials);

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

  const data = {
    balanceMsats: 0,
    owner: request.listenerId
  };

  const resp = await db.collection('listeners').doc(request.listenerId).set(data);

  listenerManager.createListener(request.listenerId)
    .then((data) => res.status(200).json(data))

});

exports.rechargeBalance = handleErrorAsync(async (req, res, next) => {

  const request = { 
    r_hash_str: req.body.r_hash_str
  };

  const { uid, value } = await invoiceManager.getUidFromInvoice(request.r_hash_str);

  // Check if invoice hash already exists in db, return if previously used
  const record = await invoiceManager.checkListenerHash(request.r_hash_str)

  if (record.length === 1 && record[0].recharged) {
    return res.status(500).json( 'Invoice already has been used to recharge' )
  }

  // Check if new invoice has been settled, return if false
  const status = await invoiceManager.checkListenerStatus(request.r_hash_str, funding_ln)

  if (!status.settled) {
    return res.status(500).json( 'Invoice not settled' )
  }
  else if (status.settled && !record[0].recharged) {
    const recharge = await invoiceManager.updateListenerInvoiceSettled(request.r_hash_str, uid);

    // Update firestore if successful
    if (recharge) {

      tx_data = recharge[0]
      const fstoreUpdate = await db.collection('listeners')
                                    .doc(tx_data.listener_id)
                                    .set({
                                      balanceMsats: tx_data.balance_msats,
                                    }, { merge: true });

      if (fstoreUpdate) { 
        res.status(200).json({uid: tx_data.listener_id, balance_msats: tx_data.balance_msats})
      }
      else if (!fstoreUpdate) {
        res.status(500).json( { error: 'Error updating listener balance in cache' } )
      }
    }
    else if (!recharge) {
      res.status(500).json( { error: 'Database error' } )
    }
  }
  
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

