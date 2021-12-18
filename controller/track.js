const log = require('loglevel')
const trackManager = require('../library/trackManager')
const invoiceManager = require('../library/invoiceManager')
const storage = require('../library/storage')

const client = "placeholder"

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

exports.check = handleErrorAsync(async (req, res, next) => {

  const request = { 
    cid: req.query.trackId,
  };

  const check = await trackManager.checkPlays(request.cid)

  if (check) {
    res.status(200).json( { 
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


exports.create = handleErrorAsync(async (req, res, next) => {



  const request = {
    owner: req.body.owner,
    bucket: req.body.bucket,
    trackId: req.body.trackId, 
    initPlaysRemaining: req.body.initPlaysRemaining, 
    msatsPerPlay: req.body.msatsPerPlay
  }

  log.debug(`Creating track ${request.owner}:${request.trackId} in tracks table`);

  const create = await trackManager.createTrack( request.owner,
                                                 request.bucket,
                                                 request.trackId,
                                                 request.initPlaysRemaining,
                                                 request.msatsPerPlay )

  if (create) {
    const check = await trackManager.checkPlays(request.trackId)

    if (check) {
      res.status(200).json( { 
                              owner: check.owner,
                              cid: check.cid,
                              play_count: check.play_count,
                              plays_remaining: check.plays_remaining,
                              msats_per_play: check.msats_per_play,
                              } )
      }
      else if (!check) {
        res.status(500).json( { error: 'Database error creating track' } )
      }
  else {
    res.status(500).json( { error: 'Database error creating track' } )
  }
}
});

exports.delete = handleErrorAsync(async (req, res, next) => {



  const request = {
    owner: req.body.owner,
    bucket: req.body.bucket,
    cid: req.body.cid
  }

  log.debug(`Deleting track ${request.owner}:${request.cid} in tracks table`);

  storage.deleteFromStorage(request.bucket, request.owner, request.cid)
    .then(() => trackManager.deleteTrack(request.owner, request.cid))
    .then((data) => res.status(200).json(data))
    .catch((err) => log.error(err))

  // Delete media from IPFS
  // const unpin = await pinata.unpin(request.trackId)
  //                       // Delete track record from db
  //                       
  //                       .then((result) => res.status(200).json(result))
  //                       .catch((err) => log.error(err))

});

exports.mark = handleErrorAsync(async (req, res, next) => {



  const request = { 
    cid: req.body.cid,
    count: req.body.count
  };

  const check = await trackManager.checkPlays(request.cid)

  if (request.count <= check.plays_remaining) {
    const add = await trackManager.markPlay(request.cid, request.count)

    if (add === 1) {
      // res.status(200).json( `Updated play count and plays remaining by ${request.count} for ${request.cid}` )
      const check = await trackManager.checkPlays(request.cid)

      if (check) {
        res.status(200).json( { 
                                owner: check.owner,
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
  const cost = await trackManager.checkPrice(status.memo)
  const increment = (Number(status.value_msat) / cost['msats_per_play'])
  // console.log(increment)

  // Write new invoice r_hash_str value to db if it has been settled
  if (status.settled && record.length === 0) {
    const add = await invoiceManager.addHash(request.r_hash_str,
                                                status.value_msat,
                                                status.settled,
                                                status.memo)
                                    .then(() => {
                                      trackManager.rechargePlays(status.memo, increment)
                                    })
                                    .then(() => {
                                      return invoiceManager.markRecharged(request.r_hash_str)
                                    })
                                    .catch((err) => log.error(err))
  
    if (add) {
      // res.status(200).json( `Recharged plays for ${status.memo} by ${increment}` )
      const check = await trackManager.checkPlays(status.memo)

      if (check) {
        res.status(200).json( { 
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
    const add = await trackManager.rechargePlays(status.memo, increment)
                                  .then(() => {
                                    return invoiceManager.markRecharged(request.r_hash_str)
                                  })

    if (add) {
      // res.status(200).json( `Recharged plays for ${status.memo} by ${increment}` )
      const check = await trackManager.checkPlays(status.memo)

      if (check) {
        res.status(200).json( { 
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

exports.upload = handleErrorAsync(async (req, res, next) => {



  // console.log(req.body)
  // log.debug(`Locating files: ${JSON.stringify(req.files)}`);

  const fileObj = req.files.filename;

  const request = {
    title: req.body.title,
    bucket: req.body.bucket,
    owner: req.body.owner, 
  }

  log.debug(`Uploading track ${request.owner}:${request.title} to ${request.bucket}`);

  const upload = await storage.uploadToStorage(Buffer.from(fileObj.data, 'base64'), request.bucket, request.owner)

  if (upload) {
    res.status(200).json(upload)
  }

});

