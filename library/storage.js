const log = require('loglevel')
const stream = require('stream');
const {Storage} = require('@google-cloud/storage');
const{ randomUUID } = require('crypto');
const { request } = require('http');
const Jimp = require('jimp');

const storage = new Storage({ projectId: process.env.FIREBASE_PROJECT_ID,
    credentials: { client_email: process.env.FIREBASE_CLIENT_EMAIL,
                    private_key: process.env.FIREBASE_PRIVATE_KEY_ALT
                  } 
  })


async function deleteFromStorage(bucketName, owner, cid, type) {
    log.debug(`Deleting ${cid} from storage`);
    // const bucket = storage.bucket(bucketName)

    let filePath;
    if (type == "track") {
      filePath = `content/${owner}/tracks/${cid}`
    }
    else if (type == "artwork") {
      filePath = `content/${owner}/artwork/${cid}`
    }

    return new Promise((resolve, reject) => {
        storage.bucket(bucketName).file(filePath).delete()
            .then(() => { console.log(`${owner}:${cid} deleted from bucket: ${bucketName}`); resolve({cid: cid}) } )
            .catch((err) => reject(err))
    })
};

async function uploadToStorage(filePath, fileName, bucketName, owner, type) {
    log.debug(`Uploading ${type} to storage`);
    const bucket = storage.bucket(bucketName)

    let destFileName;
    let file;
    if (type == "track") {
      destFileName = `${randomUUID()}.mp3`;
      file = bucket.file(`content/${owner}/tracks/${destFileName}`)
    }
    else if (type == "artwork") {
      destFileName = `${randomUUID()}-${fileName}`;
      file = bucket.file(`content/${owner}/artwork/${destFileName}`)
    }

     // Create a pass through stream from a string
    const passthroughStream = new stream.PassThrough();

    if (type == "track") {
      passthroughStream.write(filePath);
      passthroughStream.end();
    }
    else if (type == "artwork") {
      Jimp.read(filePath)
        .then(image => {
          return image
            .resize(420,420)
            .quality(60)
        })
        .then(resized => {
          resized.getBufferAsync(Jimp.AUTO)
            .then(buf => {
              passthroughStream.write(buf);
              passthroughStream.end();
            })

        })
        .catch(err => {
          console.error(err);
        });
    }


    async function streamFileUpload() {
        passthroughStream.pipe(file.createWriteStream()).on('finish', () => {
            if (type == "artwork") {
              file.makePublic();
            }
        });
    
        // console.log(`${destFileName} uploaded to ${bucketName}`);
      }

    return new Promise((resolve, reject) => {
        streamFileUpload()
          .then(() => { console.log(`${destFileName} uploaded to ${bucketName}`);
                        resolve({destFileName: destFileName}) } )
          .catch((err) => reject(err))
    })
};

module.exports = {
    deleteFromStorage,
    uploadToStorage
}