const axios = require('axios');
const apiKeys = require('../.keys/api_keys.json')
const trackManager = require('../library/trackManager')
const invoiceManager = require('../library/invoiceManager')

const config = {
  pinataKey: process.env.PINATA_KEY,
  pinataSecret: process.env.PINATA_SECRET,
}

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
exports.testAuth = handleErrorAsync(async (req, res, next) => {
  const url = `https://api.pinata.cloud/data/testAuthentication`;
  return axios
      .get(url, {
          headers: {
              pinata_api_key: config.pinataKey,
              pinata_secret_api_key: config.pinataSecret
          }
      })
      .then(response => res.json(response.data))
      .catch(error => console.log(error));
});


exports.check = handleErrorAsync(async (req, res, next) => {

  const request = { 
    client: apiKeys['clients'][req.query.client]['pubkey'],
    trackId: req.query.trackId,
  };

  const check = await trackManager.checkPlays(request.client, request.trackId)

  if (check) {
    res.status(200).json( { 
                            client: check.client,
                            cid: check.cid,
                            play_count: check.play_count,
                            plays_remaining: check.plays_remaining,
                            msats_per_play: check.msats_per_play,
                           } )
  }
  else if (!check) {
    res.status(500).json( { error: 'Database error, no such track' } )
  }

});

// POST


exports.create = async (req, res, err) => {

  res.json('create')
};

exports.mark = handleErrorAsync(async (req, res, next) => {

  const request = { 
    client: apiKeys["clients"][req.body.client]['pubkey'],
    trackId: req.body.trackId,
    count: req.body.count
  };

  const check = await trackManager.checkPlays(request.client, request.trackId)

  if (request.count <= check.plays_remaining) {
    const add = await trackManager.markPlay(request.client, request.trackId, request.count)

    if (add === 1) {
      // res.status(200).json( `Updated play count and plays remaining by ${request.count} for ${request.trackId}` )
      const check = await trackManager.checkPlays(request.client, request.trackId)

      if (check) {
        res.status(200).json( { 
                                client: check.client,
                                cid: check.cid,
                                play_count: check.play_count,
                                plays_remaining: check.plays_remaining,
                                msats_per_play: check.msats_per_play,
                               } )
      }
      else if (!check) {
        res.status(500).json( { error: 'Database error, no such track' } )
      }
    }
    else {
      res.status(500).json( 'Database error' )
    }
  }
  else {
    res.status(500).json( 'Play count exceeds plays remaining' )
  }
 
});

exports.recharge = handleErrorAsync(async (req, res, next) => {

  const request = { 
    client: apiKeys["clients"][req.body.client]['pubkey'],
    r_hash_str: req.body.r_hash_str
  };

  // Check if invoice hash already exists in db, return if previously used
  const record = await invoiceManager.checkHash(request.r_hash_str)

  if (record.length === 1 && record[0].recharged) {
    return res.status(500).json( 'Invoice already has been used to recharge' )
  }

  // Check if new invoice has been settled, return if false
  const status = await invoiceManager.checkStatus(request.r_hash_str)

  if (!status.settled) {
    return res.status(500).json( 'Invoice not settled' )
  }

  // Set play increment according to payment amount and track's sats_per_play value
  const cost = await trackManager.checkPrice(request.client, status.memo)
  const increment = (Number(status.value_msat) / cost['msats_per_play'])
  // console.log(increment)

  // Write new invoice r_hash_str value to db if it has been settled
  if (status.settled && record.length === 0) {
    const add = await invoiceManager.addHash(request.r_hash_str,
                                                status.value_msat,
                                                status.settled,
                                                status.memo)
                                    .then(() => {
                                      trackManager.rechargePlays(request.client, status.memo, increment)
                                    })
                                    .then(() => {
                                      return invoiceManager.markRecharged(request.r_hash_str)
                                    })
  
    if (add) {
      // res.status(200).json( `Recharged plays for ${status.memo} by ${increment}` )
      const check = await trackManager.checkPlays(request.client, status.memo)

      if (check) {
        res.status(200).json( { 
                                client: check.client,
                                cid: check.cid,
                                play_count: check.play_count,
                                plays_remaining: check.plays_remaining,
                                msats_per_play: check.msats_per_play,
                               } )
      }
      else if (!check) {
        res.status(500).json( { error: 'Database error, no such track' } )
      }
    }
    else {
      res.status(500).json( 'Database error' )
    }
  }

  // Only recharge track if r_hash_str value already exists in db but recharged is false
  else if (status.settled && !record[0].recharged) {
    const add = await trackManager.rechargePlays(request.client, status.memo, increment)
                                  .then(() => {
                                    return invoiceManager.markRecharged(request.r_hash_str)
                                  })

    if (add) {
      // res.status(200).json( `Recharged plays for ${status.memo} by ${increment}` )
      const check = await trackManager.checkPlays(request.client, rstatus.memo)

      if (check) {
        res.status(200).json( { 
                                client: check.client,
                                cid: check.cid,
                                play_count: check.play_count,
                                plays_remaining: check.plays_remaining,
                                msats_per_play: check.msats_per_play,
                               } )
      }
      else if (!check) {
        res.status(500).json( { error: 'Database error, no such track' } )
      }
    }
    else {
      res.status(500).json( 'Database error' )
    }
  }
  
});

