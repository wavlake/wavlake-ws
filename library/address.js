const axios = require('axios').default;
const log = require('loglevel')

async function init(address) {

    const a = address.split("@")
    const username = a[0]
    const domain = a[1]
    // console.log(domain);
    let url;
    if (process.env.ENVIRONMENT == 'DEV') {
        url = `http://${domain}/.well-known/lnurlp/${username}`;
    }
    else {
        url = `https://${domain}/.well-known/lnurlp/${username}`;
    }

    // console.log(url);

    return new Promise((resolve, reject) => {
        axios.get(url)
            .then(function (response) {
                // handle success
                // console.log(response.data.callback);
                if (response.data.tag === 'payRequest') {
                    resolve(response.data.callback)
                }
                else {
                    throw err
                }
            })
            .catch(function (err) {
                // handle error
                log.debug(err);
                reject(err);
            })
    })
}

async function requestInvoice(url, amount) {

    return new Promise((resolve, reject) => {
        axios.get(`${url}?amount=${amount}&comment=Wavlake%20payment`)
            .then(function (response) {
                // handle success
                resolve(response.data.pr)
            })
            .catch(function (err) {
                // handle error
                reject(err);
            })
    })
}


module.exports = {
    init,
    requestInvoice
}
