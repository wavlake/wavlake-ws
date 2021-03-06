const express = require('express')

// Import controllers
const ownerRoute = require('../controller/owner.js')

// Create router
const router = express.Router()

// Routes

router.get('/get-info', ownerRoute.getInfo)
router.post('/create', ownerRoute.create)
router.post('/delete', ownerRoute.delete)
router.post('/decrypt', ownerRoute.decrypt)

// Export router
module.exports = router