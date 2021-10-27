# wavlake-ws (alpha)

wavlake-ws (web service) is a fully open-source tool designed to be run by individuals who want to sell media for bitcoin payments over the Lightning Network. The service's endpoints are designed to power any front-end application, either as a single backend service or as part of a collection. [wavlake.com](wavlake.com), for example, runs on wavlake-ws as its backend.

Currently, wavlake-ws requires `lnd` as a Lightning service implementation. We hope to support other implementations in the future.

NOTE: wavlake-ws is currently in alpha release mode. We appreciate your patience and support. Please add any findings of bugs or issues to the [issues](https://github.com/wavlake/wavlake-ws/issues) page.


## Development

wavlake-ws is built on the [Express](https://expressjs.com/) javascript framework and runs on a sqlite3 database by default.

`lnd` is required with access to macaroon and tls cert for host. [Polar](https://lightningpolar.com/) works well as a local development backend.

### lnd

```
lncli bakemacaroon \
uri:/lnrpc.Lightning/GetInfo \
uri:/lnrpc.Lightning/AddInvoice \
uri:/lnrpc.Lightning/LookupInvoice \
uri:/signrpc.Signer/SignMessage \
uri:/signrpc.Signer/VerifyMessage \
uri:/walletrpc.WalletKit/DeriveKey \
uri:/invoicesrpc.Invoices/SubscribeSingleInvoice
```

### Express

Run `npm install` from the project root.

### Database (sqlite3)

Inspect with `sqlite3` command.

Load db in cli with
`.open db/database.sqlite`

#### Initialization
NOTE: `./data/db.sqlite` file must exist!

From the `db` directory, run:

`knex migrate:latest`

Then seed the database:

`knex seed:run`

#### Authentication

The Express server has authentication enabled by default. We can use the `/auth/sign` route to generate credentials as needed for now. To reduce friction, it can be helpful to set the `API_TIMER_WINDOW` to something high like `60000` to buy more time for the credentials to be valid. In production, however, this value should be set to `60` or less.

More details on authentication in the API Credentials section.

### Docker

TODO

Build container:

`docker build -t wavlake-api .`

Run Express server:

```
docker run -it -p 3001:3001 \
-v ~/Repos/wavlake-api/.keys:/usr/src/app/.keys \
-v ~/Repos/wavlake-api/data:/usr/src/app/data \
-v ~/Repos/wavlake-api/.env:/usr/src/app/.env \
wavlake-api
```

In the above `run` command, we mount a couple volumes to the container from the host machine, namely `.keys` and `data`. This enables us to access these files directly from the host machine without copying them to the container. Also, in the case of the `data` dir, we can persist database updates to the sqlite3 file residing on the host machine so we don't lose any updates when the container is destroyed.

TODO: Issue connecting running Docker instance with `lnd` nodes running in Polar.


## API Credentials (alpha)

In order to mitigate the risk of unauthorized access, we use a form of public key infrastructure (PKI) that leverages the public/private keys available via the Bitcoin/Lightning services that are requirements for running the server. This process is designed to balance security and ease of use for anyone managing their own service. 

The process of authenticating a client to use the wavlake service involves a manual step of modifying the `./.keys/api_keys.json` file. The client requesting access will provide the service owner with a `username`, `secret`, and `pubkey` derived from a private key in their keychain. The client must have access to the corresponding private key, but does not need to share it.

Once the service owner has modified the `api_keys.json` file with the client's `username`, `secret`, and `pubkey`, the client can start making requests to the service using Basic Authentication over HTTP. Per standard practice, the `username` field in the authentication header should be the client's username. The exception to the norm in this case is the `password` field. All requests must contain a message from the client that is signed using their private key. The message to be signed by the client should be a concatenation of their `username`, `secret`, and a unix timestamp rounded to a recent whole number. The timestamp should be divided by the server's `API_TIMER_WINDOW` value that is set in the `.env` file.

The server authenticates the request by checking the signature against the user's public key. The time value ensures that a signature cannot be used long after the valid API timer window has expired.

The `api_keys.json` file should be stored in the `.keys` folder. The contents should look as follows:

```
{
    "clients": {
        "wavlake" : { "pubkey": "abcdefge97b61279352379aeae988a88cde3fe2fbe7d08b4771dcb2e668cbc6278", "secret": "moneyprintergobrrr" },
        "example" : { "pubkey": "12345678e97b61279352379aeae988a88cde3fe2fbe7d08b4771dcb2e668cbc627", "secret": "numbergoup" }
    }
}
```