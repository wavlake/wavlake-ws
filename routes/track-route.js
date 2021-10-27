const express = require('express')

// Import controllers
const trackRoute = require('../controller/track.js')

// Create router
const router = express.Router()

// Routes

router.get('/test-auth', trackRoute.testAuth)
router.get('/check', trackRoute.check)

router.post('/recharge', trackRoute.recharge)
router.post('/mark', trackRoute.mark)
router.post('/create', trackRoute.create)

// Export router
module.exports = router