const express = require('express')

// Import controllers
const trackRoute = require('../controller/track.js')

// Create router
const router = express.Router()

// Routes

router.get('/check', trackRoute.check)

router.post('/create', trackRoute.create)
router.post('/delete', trackRoute.delete)
router.post('/mark', trackRoute.mark)
router.post('/recharge', trackRoute.recharge)
router.post('/upload', trackRoute.upload)

// Export router
module.exports = router