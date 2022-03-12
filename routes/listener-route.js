const express = require('express')

// Import controllers
const listenerRoute = require('../controller/listener.js')

// Create router
const router = express.Router()

// Routes

// router.get('/get-info', listenerRoute.getInfo)
router.post('/create', listenerRoute.create)
router.post('/recharge-balance', listenerRoute.rechargeBalance)
// router.post('/delete', listener.delete)
// router.post('/decrypt', listener.decrypt)

// Export router
module.exports = router