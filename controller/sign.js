const lnd = require('../library/lnd')

const key_family = 139

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
exports.getPublicKey = handleErrorAsync(async (req, res, next) => {

  const {
    createHash
  } = await import('crypto');

  // Hash the user name before converting to byte buffer/integer for key_index
  const hash = createHash('sha256');
  const userHash = hash.update(req.query['user']).digest('hex')

  let request = { 
    key_family: key_family, 
    key_index: Buffer.from(userHash, 'hex').readUInt16BE()
  }; 
  lnd.walletKit.deriveKey(request, function(err, response) {
    res.json({publickey: Buffer.from(response['raw_key_bytes']).toString('hex')});
  });

})

exports.signMessage = handleErrorAsync(async (req, res, next) => {

    const {
      createHash
    } = await import('crypto');

    // Hash the user name before converting to byte buffer/integer for key_index
    const hash = createHash('sha256');
    const userHash = hash.update(req.query['client']).digest('hex')

    const request = { 
        msg: Buffer.from(req.query["message"]),
        key_loc: { "key_family": key_family, 
                   "key_index": Buffer.from(userHash, 'hex').readUInt16BE() },
        double_hash: false,
        compact_sig: false
      };
    
    lnd.signer.signMessage(request, function(err, response) {
        if (err) {
          res.json(err)
        }
        else {
          const signature = Buffer.from(response['signature']).toString('hex');
          res.json({signature: signature})

        }
        
    })
})

exports.verifyMessage = handleErrorAsync(async (req, res, next) => {

  const request = { 
    msg: req.query["message"],
    signature: Buffer.from(req.query["signature"], 'hex'),
    pubkey: Buffer.from(req.query["pubkey"], 'hex')
  };
  // console.log(request)
  return new Promise((resolve, reject) => {
    lnd.signer.verifyMessage(request, function(err, response) {
        if (err) {
          // console.log(response)
          reject(res.json(err))
        }
        else {
          resolve(res.json({verified: response}))
        }
    })
  })
})