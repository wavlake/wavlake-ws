# wavlake-ws (alpha)

wavlake-ws (web service) is a fully open-source tool designed to be run by individuals who want to sell media for bitcoin payments over the Lightning Network. The service's endpoints are designed to power any front-end application, either as a single backend service or as part of a collection. [wavlake.com](https://wavlake.com), for example, runs wavlake-ws as its backend.

Currently, wavlake-ws requires `lnd` as a Lightning service implementation. We hope to support other implementations in the future.

NOTE: wavlake-ws is currently in alpha release mode. We appreciate your patience and support. Please add any findings of bugs or issues to the [issues](https://github.com/wavlake/wavlake-ws/issues) page.

### Overview

Runtime: Node
Framework: Express
Lightning: lnd

### Install

`npm install`

### Run

`npm start`


## Development

wavlake-ws is built on the [Express](https://expressjs.com/) javascript framework and runs on a Postgres database using knexjs as an interface.

`lnd` is required with access to macaroon and tls cert for host. [Polar](https://lightningpolar.com/) works well as a local development backend.

### LND Credentials

Credentials are stored as encrypted JSON objects containing the owner's LND host:port, macaroon (as hex), and TLS cert (as hex).

Below are shell commands to create required the macaroon and cert.

Custom macaroon recipe (output to hex):
```
lncli bakemacaroon \
uri:/lnrpc.Lightning/AddInvoice \
uri:/lnrpc.Lightning/LookupInvoice \
uri:/signrpc.Signer/SignMessage \
uri:/signrpc.Signer/VerifyMessage \
uri:/walletrpc.WalletKit/DeriveKey \
uri:/invoicesrpc.Invoices/SubscribeSingleInvoice
```

TLS cert (output to hex)
```
cat <lnd_home>/tls.cert | od -A n -t x1 | sed 's/ //g' | tr -d '\n'
```

## Development

### Database 

postgresql

For local development on Docker:
`docker run --name postgres-dev -p 5432:5432 -e POSTGRES_PASSWORD=wavlake -d postgres`

Migration:
`knex migrate:latest`

sqlite3 (deprecated)

Note: sqlite3 behavior can vary slightly from postgresql, not a complete drop-in replacement

Inspect with `sqlite3` command.

Load db in cli with
`.open db/database.sqlite`


#### Database Initialization

From the `db` directory, run:

`knex migrate:latest`

Then seed the database:

`knex seed:run`

#### Migrations in Production

! Backup/Clone DB !
`.clone data/db-0.1.sqlite`

Make a copy of the old table:
`CREATE TABLE tracks_0_1 AS SELECT * from tracks;`

Run the latest migration:
`knex migrate:up <name-of-migration>`

Run the corresponding insert script (located in `db/scripts`)

### Docker (TODO)

Build container:

`docker build -t wavlake-ws .`

Run Express server:

```
docker run -it -p 3001:3001 \
-v /path/to/wavlake-ws/.keys:/usr/src/app/.keys:ro \
-v /path/to/wavlake-ws/data:/usr/src/app/data \
-v /path/to/wavlake-ws/.env:/usr/src/app/.env \
wavlake-ws
```

In the above `run` command, we mount a couple volumes to the container from the host machine, namely `.keys` and `data`. This enables us to access these files directly from the host machine without copying them to the container. Also, in the case of the `data` dir, we can persist database updates to the sqlite3 file residing on the host machine so we don't lose any updates when the container is destroyed.

TODO: Issue connecting running Docker instance with `lnd` nodes running in local Polar envionment.