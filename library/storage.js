const log = require('loglevel')
const FormData = require('form-data');
const pinataSDK = require('@pinata/sdk');
const { Readable } = require('stream');

const pinata = pinataSDK(process.env.PINATA_KEY, process.env.PINATA_SECRET);

const config = {
  lnd_host: process.env.LND_HOST,
  lnd_port: process.env.LND_PORT,
  file_size_limit: process.env.FILE_SIZE_LIMIT
}

// const testAuth = async (req, res, err) => {
//     const url = `https://api.pinata.cloud/data/testAuthentication`;
//     return axios
//         .get(url, {
//             headers: {
//                 pinata_api_key: config.pinataKey,
//                 pinata_secret_api_key: config.pinataSecret
//             }
//         })
//         .then(response => res.json(response.data))
//         .catch(error => console.log(error));
//   };



async function pinFileToIPFS(fileObj, title) {
    log.debug(`Pinning file to IPFS`);
    const url = `https://api.pinata.cloud/pinning/pinFileToIPFS`;

    //we gather a local file for this example, but any valid readStream source will work here.
    // let data = new FormData();
    // data.append('file', Readable.from(fileObj, {objectMode: true}));
    const readableStreamForFile = Readable.from(fileObj)
    readableStreamForFile.path = 'example.mp3'

    const options = {
        pinataMetadata: {
            name: title,
            // keyvalues: {
            //     customKey: 'customValue',
            //     customKey2: 'customValue2'
            // }
        },
        pinataOptions: {
            cidVersion: 0
        }
    };

    return new Promise((resolve, reject) => {
        pinata.pinFileToIPFS(readableStreamForFile, options).then((result) => {
            //handle results here
            console.log(result);
            resolve(result);
        }).catch((err) => {
            //handle error here
            console.log(err);
            reject(err);
        });
        // axios
        //     .post(url, data, {
        //         maxBodyLength: parseInt(config.file_size_limit),
        //         headers: {
        //             'Content-Type': `multipart/form-data; boundary=${data._boundary}`,
        //             pinata_api_key: config.pinataKey,
        //             pinata_secret_api_key: config.pinataSecret
        //         }
        //     })
        //     .then(function (response) {
        //         log.debug(`IPFS response: ${response}`);
        //         resolve(response);
        //     })
        //     .catch(function (error) {
        //         log.error(`IPFS error: ${error}`);
        //         reject(error);
        //     });
    })
};

module.exports = {
    pinFileToIPFS
}