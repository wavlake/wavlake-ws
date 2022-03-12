const axios = require('axios').default;

async function init(address) {

    const a = address.split("@")
    const username = a[0]
    const domain = a[1]
    // console.log(domain);
    const url = `https://${domain}/.well-known/lnurlp/${username}`;
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
                reject(err);
            })
            .then(function () {
                // always executed
            });
    })
}

async function requestInvoice(url, amount) {

    return new Promise((resolve, reject) => {
        axios.get(`${url}?amount=${amount}`)
            .then(function (response) {
                // handle success
                resolve(response.data.pr)
            })
            .catch(function (err) {
                // handle error
                reject(err);
            })
            .then(function () {
                // always executed
            });
    })
}


module.exports = {
    init,
    requestInvoice
}
