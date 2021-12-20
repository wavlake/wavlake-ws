const express = require('express')

// Import controllers
const ownerRoute = require('../controller/owner.js')

// Create router
const router = express.Router()

// Routes

router.post('/create', ownerRoute.create)

router.post('/decrypt', ownerRoute.decrypt)

// Export router
module.exports = router