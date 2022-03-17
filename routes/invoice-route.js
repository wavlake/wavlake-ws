// Import express
const express = require('express')

// Import controllers
const invoiceRoutes = require('../controller/invoice.js')

// Create router
const router = express.Router()

// Routes

router.post('/add', invoiceRoutes.addInvoice)
router.post('/add-funds', invoiceRoutes.addFundingInvoice)
router.post('/forward-payment', invoiceRoutes.forwardPayment)
router.post('/lookup', invoiceRoutes.lookupInvoice)
router.post('/monitor', invoiceRoutes.monitorInvoice)



// Export router
module.exports = router