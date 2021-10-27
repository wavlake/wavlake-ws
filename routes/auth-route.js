const express = require('express')
const basicAuth = require('express-basic-auth')
const { apiAuth } = require('../library/auth')

// Create router
const router = express.Router()

// Import controllers

const sign = require('../controller/sign.js')

// Routes
// PUBLIC
router.get('/sign', sign.signMessage)
// router.get('/pubkey', sign.getPublicKey)
// router.get('/verify', sign.verifyMessage)

router.post('/', basicAuth( { authorizer: apiAuth, authorizeAsync: true } ), async (req, res, err) => {
    res.status(200).json({ 'authorized': true })
})

// Export router
module.exports = router