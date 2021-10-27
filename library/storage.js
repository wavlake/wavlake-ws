const axios = require('axios');
const encrypt = require('./encrypt')

const config = {
  pinataKey: process.env.PINATA_KEY,
  pinataSecret: process.env.PINATA_SECRET,
  lnd_host: process.env.LND_HOST,
  lnd_port: process.env.LND_PORT
}


exports.testAuth = async (req, res, err) => {
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
  };