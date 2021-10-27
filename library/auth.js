const log = require('loglevel')
const apiKeys = require('../.keys/api_keys.json')
const lnd = require('./lnd')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
dayjs.extend(utc)

const config = {
  api_timer: process.env.API_TIMER_WINDOW,
}

async function apiAuth(username, password, cb) {

    // Get latest times ([last unit, current unit])
    const times = timer()
    // console.log(times)

    // Check signature against valid times
    const signature = Buffer.from(password, 'hex')
    const pubkey = Buffer.from(apiKeys['clients'][username]['pubkey'], 'hex')
    const clientSecret = apiKeys['clients'][username]['secret']
    const request = { 
      msg: Buffer.from(`${username}${clientSecret}${times[0].toString()}`),
      signature: signature,
      pubkey: pubkey
    };
  
    const request_two = { 
      msg: Buffer.from(`${username}${clientSecret}${times[0].toString()}`),
      signature: signature,
      pubkey: pubkey
    };

    log.debug(`Checking API credentials for ${username}`);
    const response_one = await new Promise((resolve, reject) => {
      lnd.signer.verifyMessage(request, function(err, response) {
          if (err) {
            reject(err)
          }
          else {
            // console.log(`one: ${response.valid}`)
            resolve(response.valid)
          }
        })
      }
    )

    return cb(null, await new Promise((resolve, reject) => {
      lnd.signer.verifyMessage(request_two, function(err, response) {
          if (err) {
            reject(err)
          }
          else {
            // console.log(`two: ${response.valid}`)
            resolve(response_one || response.valid)
          }
        })
      })
    )
}

function timer() {
  const ceil = Math.ceil(dayjs.utc().unix() / parseInt(config.api_timer))
  const floor = Math.floor(dayjs.utc().unix() / parseInt(config.api_timer))
  log.debug(`Current API timer window: ${ceil}`);
  return [ ceil, floor ]
}

// function apiAuth(username, password, cb) {

//     const authorized = encryption.encryptString(username)
//                          .then(enc_username => {
//                             console.log(enc_username);
//                             if (!apiKeys["users"][enc_username]) {
//                               return cb(null, false)
//                             }
//                             else {
//                                 encryption.encryptString(password)
//                                 .then(enc_password => {
//                                   console.log(enc_password);
//                                   return cb(null, basicAuth.safeCompare(enc_password, apiKeys["users"][enc_username]))
//                                 })
//                             }
//                          })
//     // const userMatches = basicAuth.safeCompare(username, encryption.encryptString(username))
//     // const passwordMatches = basicAuth.safeCompare(password, apiKeys["users"][username])

//     return authorized
// }

module.exports = {
    apiAuth
}