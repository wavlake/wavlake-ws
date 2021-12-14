# wavlake-ws (alpha)

wavlake-ws (web service) is a fully open-source tool designed to be run by individuals who want to sell media for bitcoin payments over the Lightning Network. The service's endpoints are designed to power any front-end application, either as a single backend service or as part of a collection. [wavlake.com](https://wavlake.com), for example, runs on wavlake-ws as its backend.

Currently, wavlake-ws requires `lnd` as a Lightning service implementation. We hope to support other implementations in the future.

NOTE: wavlake-ws is currently in alpha release mode. We appreciate your patience and support. Please add any findings of bugs or issues to the [issues](https://github.com/wavlake/wavlake-ws/issues) page.

## Overview

Runtime: Node
Framework: Express
Lightning: lnd
Storage: IPFS (via Piñata)

## Install

`npm install`


## Development

wavlake-ws is built on the [Express](https://expressjs.com/) javascript framework and runs on a sqlite3 database by default.

`lnd` is required with access to macaroon and tls cert for host. [Polar](https://lightningpolar.com/) works well as a local development backend.

### lnd

```
lncli bakemacaroon \
uri:/lnrpc.Lightning/AddInvoice \
uri:/lnrpc.Lightning/LookupInvoice \
uri:/invoicesrpc.Invoices/SubscribeSingleInvoice
```

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


### Docker

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