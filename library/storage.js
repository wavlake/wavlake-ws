const log = require('loglevel')
const stream = require('stream');
const {Storage} = require('@google-cloud/storage');
const{ randomUUID } = require('crypto')

const storage = new Storage({ projectId: process.env.FIREBASE_PROJECT_ID,
    credentials: { client_email: process.env.FIREBASE_CLIENT_EMAIL,
                    private_key: process.env.FIREBASE_PRIVATE_KEY_ALT
                  } 
  })


async function deleteFromStorage(bucketName, owner, cid) {
    log.debug(`Deleting ${cid} from storage`);
    // const bucket = storage.bucket(bucketName)
    const filePath = `content/${owner}/tracks/${cid}`

    return new Promise((resolve, reject) => {
        storage.bucket(bucketName).file(filePath).delete()
            .then(() => { console.log(`${owner}:${cid} deleted from bucket: ${bucketName}`); resolve({cid: cid}) } )
            .catch((err) => reject(err))
    })
};

async function uploadToStorage(filePath, bucketName, owner) {
    log.debug(`Uploading to storage`);
    const destFileName = `${randomUUID()}.mp3`;
    const bucket = storage.bucket(bucketName)
    const file = bucket.file(`content/${owner}/tracks/${destFileName}`)

     // Create a pass through stream from a string
    const passthroughStream = new stream.PassThrough();
    passthroughStream.write(filePath);
    passthroughStream.end();

    async function streamFileUpload() {
        passthroughStream.pipe(file.createWriteStream()).on('finish', () => {
          // The file upload is complete
        });
    
        // console.log(`${destFileName} uploaded to ${bucketName}`);
      }

    return new Promise((resolve, reject) => {
        streamFileUpload()
            .then(() => { console.log(`${destFileName} uploaded to ${bucketName}`); resolve({trackId: destFileName}) } )
            .catch((err) => reject(err))
    })
};

module.exports = {
    deleteFromStorage,
    uploadToStorage
}