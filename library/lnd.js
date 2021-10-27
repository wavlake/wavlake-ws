const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const fs = require("fs");
const path = require('path');

const config = {
  macaroon: process.env.MACAROON,
  tls: process.env.TLS_PATH,
  lnd_host: process.env.LND_HOST,
  lnd_port: process.env.LND_PORT
}

// const { Buffer } = 'buffer';

//// gRPC INITIALIZATION

// Due to updated ECDSA generated tls.cert we need to let gprc know that
// we need to use that cipher suite otherwise there will be a handhsake
// error when we communicate with the lnd rpc server.
process.env.GRPC_SSL_CIPHER_SUITES = 'HIGH+ECDSA'

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
                                                 path.join(__dirname, 'signer.proto'),
                                                 path.join(__dirname, 'walletkit.proto')
                                                ], 
                                                loaderOptions);

// Load lnd macaroon
// let m = fs.readFileSync(config.macaroon);
// let macaroon = m.toString('hex');
let macaroon = config.macaroon

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
let lnrpcDescriptor = grpc.loadPackageDefinition(packageDefinition);
let lnrpc = lnrpcDescriptor.lnrpc;
let client = new lnrpc.Lightning(`${config.lnd_host}:${config.lnd_port}`, credentials);

// Create invoices interface
const invoicesrpc = grpc.loadPackageDefinition(packageDefinition).invoicesrpc;
let invoices = new invoicesrpc.Invoices(`${config.lnd_host}:${config.lnd_port}`, credentials);

// Create signer interface
const signrpc = grpc.loadPackageDefinition(packageDefinition).signrpc;
let signer = new signrpc.Signer(`${config.lnd_host}:${config.lnd_port}`, credentials);

// Create walletkit interface
const walletrpc = grpc.loadPackageDefinition(packageDefinition).walletrpc;
let walletKit = new walletrpc.WalletKit(`${config.lnd_host}:${config.lnd_port}`, credentials);

module.exports = {
    client,
    invoices,
    signer,
    walletKit
}