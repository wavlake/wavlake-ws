// const grpc = require('@grpc/grpc-js');
const grpc = require('grpc')
const protoLoader = require('@grpc/proto-loader');
const fs = require("fs");
const log = require('loglevel')
const path = require('path');
const ownerManager = require('./ownerManager')
const encryption = require('../library/encryption')
const key_family = 128
const key_index = 3

const config = {
  macaroon: process.env.MACAROON,
  tls: process.env.TLS_PATH,
  lnd_host: process.env.LND_HOST,
  lnd_port: process.env.LND_PORT
}

//// gRPC INITIALIZATION

// Due to updated ECDSA generated tls.cert we need to let gprc know that
// we need to use that cipher suite otherwise there will be a handhsake
// error when we communicate with the lnd rpc server.
//process.env.GRPC_SSL_CIPHER_SUITES = 'HIGH+ECDSA'
process.env.GRPC_SSL_CIPHER_SUITES = 'HIGH+ECDSA:ECDHE-RSA-AES128-GCM-SHA256'

// We need to give the proto loader some extra options, otherwise the code won't
// fully work with lnd.
const loaderOptions = {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
};
const packageDefinition = protoLoader.loadSync([ path.join(__dirname, 'lightning.proto'),
                                                 path.join(__dirname, 'invoices.proto'),
                                                 path.join(__dirname, 'router.proto'),
                                                 path.join(__dirname, 'signer.proto'),
                                                 path.join(__dirname, 'walletkit.proto')
                                                ], 
                                                loaderOptions);

let macaroon = config.macaroon

// Load lnd macaroon
// let m = fs.readFileSync(config.macaroon);
// let macaroon = m.toString('hex');

// Build meta data credentials
let metadata = new grpc.Metadata()
metadata.add('macaroon', macaroon)
let macaroonCreds = grpc.credentials.createFromMetadataGenerator((_args, callback) => {
  callback(null, metadata);
});

// Combine credentials
let lndCert = fs.readFileSync(config.tls);
let sslCreds = grpc.credentials.createSsl(lndCert);
let credentials = grpc.credentials.combineChannelCredentials(sslCreds, macaroonCreds);

// Create lightning interface
const lnrpc = grpc.loadPackageDefinition(packageDefinition).lnrpc;
const lnClient = new lnrpc.Lightning(`${config.lnd_host}:${config.lnd_port}`, credentials);

// // Create invoices interface
const invoicesrpc = grpc.loadPackageDefinition(packageDefinition).invoicesrpc;
let invoicesClient = new invoicesrpc.Invoices(`${config.lnd_host}:${config.lnd_port}`, credentials);

// // Create invoices interface
const routerrpc = grpc.loadPackageDefinition(packageDefinition).routerrpc;
let router = new routerrpc.Router(`${config.lnd_host}:${config.lnd_port}`, credentials);

// // Create signer interface
const signrpc = grpc.loadPackageDefinition(packageDefinition).signrpc;
let signer = new signrpc.Signer(`${config.lnd_host}:${config.lnd_port}`, credentials);

// // Create walletkit interface
// const walletrpc = grpc.loadPackageDefinition(packageDefinition).walletrpc;
// let walletKit = new walletrpc.WalletKit(`${config.lnd_host}:${config.lnd_port}`, credentials);


// Create connection object
async function initConnection(owner) {
  log.debug(`Generating lnd connection for ${owner}`);
  const ownerData = await ownerManager.getOwnerInfo(owner);

  // console.log(ownerData)
  const lndRequest = { 
    msg: Buffer.from(owner),
    key_loc: { "key_family": key_family, 
                "key_index": key_index },
    double_hash: false,
    compact_sig: false
  };
  log.debug(`Decrypting config for ${owner}`);
  return new Promise((resolve, reject) => {
    signer.signMessage(lndRequest, function(err, response) {
      if (err) {
        res.json(err)
      }
      else {
        const signature = Buffer.from(response['signature']).toString('hex');
        encryption.decryptString(ownerData.config, signature, ownerData['salt'])
          .then((data) => { 
            const j = JSON.parse(`${data.replace(/'/g, '"')}`)
            // Build meta data credentials
            const metadata = new grpc.Metadata()
            metadata.add('macaroon', j.macaroon)
            const macaroonCreds = grpc.credentials.createFromMetadataGenerator((_args, callback) => {
              callback(null, metadata);
            });

            // Combine credentials
            let sslCreds = grpc.credentials.createSsl(Buffer.from(j.cert, 'hex'));
            let credentials = grpc.credentials.combineChannelCredentials(sslCreds, macaroonCreds);
            resolve({ host: j.host, credentials: credentials })
          })
          .catch(err => reject(err))
      }
    })
  })
}

// // Check invoice status in lnd
// async function checkStatus(owner, r_hash_str) {

//   const owner = req.body.owner;

//   const request = { 
//       r_hash: Buffer.from(r_hash_str, 'hex'),
//     };

//   const ownerData = await initConnection(owner)
//   // console.log(ownerData);
//   let ln = new lnd.lnrpc.Lightning(`${ownerData.host}`, ownerData.credentials);

//   log.debug(`Checking status of ${r_hash_str} invoice in lnd db`);
//   return new Promise((resolve, reject) => {
//     ln.lookupInvoice(request, (err, response) => {
//           if (err) {
//               reject(err);
//           }
//           else {
//               resolve(response);
//           }
//       })
//   })
// }

module.exports = {
    // client,
    // checkStatus,
    invoicesClient,
    invoicesrpc,
    initConnection,
    lnClient,
    lnrpc,
    router,
    signer,
    // walletKit
}