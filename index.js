const config = require('dotenv').config()

// Import dependencies
const express = require('express')
const compression = require('compression')
const cors = require('cors')
const helmet = require('helmet')
const bodyParser = require('body-parser')
const fileUpload = require('express-fileupload');
const log = require('loglevel')
log.setLevel(process.env.LOGLEVEL)
const corsHost = process.env.CORS_HOST

// Import routes
// const authRouter = require('./routes/auth-route')
const invoiceRouter = require('./routes/invoice-route')
const listenerRouter = require('./routes/listener-route')
const ownerRouter = require('./routes/owner-route')
const trackRouter = require('./routes/track-route')

// Set default port for express app
const PORT = process.env.EXPRESS_PORT || 3001

// Create express app
const app = express()

var corsOptions = {
  origin: `${corsHost}`,
  optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
}

// Apply middleware
// Note: Keep this at the top, above routes
app.use(cors(corsOptions))
app.use(helmet())
app.use(compression())
app.use(express.urlencoded({ extended: true }))
app.use(bodyParser.json());
app.use(express.json())
app.use(fileUpload())

// ROUTES
app.use('/invoice', invoiceRouter)
app.use('/listener', listenerRouter)
app.use('/owner', ownerRouter)
app.use('/track', trackRouter)

// Implement 500 error route
app.use(function (err, req, res, next) {
  console.error(err.stack)
  res.status(500).send('There has been a problem')
})

// Implement 401 error route
app.use(function (req, res, next) {
  res.status(401).send('Unauthorized')
})

// Implement 404 error route
app.use(function (req, res, next) {
  res.status(404).send('Sorry that page could not be found')
})

// Start express app
app.listen(PORT, function() {
  console.log(`Server is running on: ${PORT}`)
})