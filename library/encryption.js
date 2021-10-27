const fs = require("fs");
const stream = require("stream");

const config = {
    api_secret: process.env.API_SECRET,
  }

const iv = Buffer.alloc(16, 0); // Initialization vector.

// Decrypt string
async function decryptString(hash) {

    const algorithm = 'aes-192-cbc';
    // First, we'll generate the key. The key length is dependent on the algorithm.
    // In this case for aes192, it is 24 bytes (192 bits).
    await import('crypto')
        .then(async (crypto) => {
            crypto.scrypt(config.api_secret, 'pepper', 24, (err, key) => {
                if (err) throw err;

                const decipher = crypto.createDecipheriv(algorithm, key, iv);
            
                let decrypted = decipher.update(hash, 'hex', 'utf8');
                decrypted += decipher.final('utf8');
                console.log(decrypted);

            });
        })
}


// Encrypt string
async function encryptString(str) {

    const algorithm = 'aes-192-cbc';
    // First, we'll generate the key. The key length is dependent on the algorithm.
    // In this case for aes192, it is 24 bytes (192 bits).
    return new Promise((resolve, reject) => {
        import('crypto')
        .then(async (crypto) => {
            crypto.scrypt(config.api_secret, 'pepper', 24, (err, key) => {
                if (err) reject(err);
                const cipher = crypto.createCipheriv(algorithm, key, iv);
            
                // console.log(Buffer.concat([cipher.update(str), cipher.final()]).toString('hex'))
                let encrypted = cipher.update(str, 'utf8', 'hex');
                encrypted += cipher.final('hex');
                // console.log(`Result: ${encrypted}`)
                return resolve(encrypted);
            });
        })
    })

}


// Encrypt file and store locally
async function encryptFile(password, 
                           salt, 
                           fileInput, 
                           fileOutput) {

    const outputFile = './unnamed.enc'
    const algorithm = 'aes-192-cbc';
    // First, we'll generate the key. The key length is dependent on the algorithm.
    // In this case for aes192, it is 24 bytes (192 bits).
    await import('crypto')
        .then(async (crypto) => {
            crypto.scrypt(password, salt, 24, (err, key) => {
                if (err) throw err;
                // Then, we'll generate a random initialization vector
                crypto.randomFill(new Uint8Array(16), (err, iv) => {
                    if (err) throw err;
            
                    const cipher = crypto.createCipheriv(algorithm, key, iv);
                
                    const input = fs.createReadStream('./unnamed.jpeg');

                    fs.open(outputFile, 'w', function(err, file) {
                        if (err) throw err;
                        const output = fs.createWriteStream(outputFile);
                        stream.pipeline(input, cipher, output, (err, file) => {
                            if (err) throw err;
                            else {
                                return Promise.resolve(file)
                            }
                        });
                    })
                });
            });
        })

}

module.exports = {
    encryptFile,
    encryptString,
    decryptString,
}