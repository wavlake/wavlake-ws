// Import express
const express = require('express')

// Import controllers
const invoiceRoutes = require('../controller/invoice.js')

// Create router
const router = express.Router()

// Routes

router.post('/add', invoiceRoutes.addInvoice)
router.post('/monitor', invoiceRoutes.monitorInvoice)
router.post('/lookup', invoiceRoutes.lookupInvoice)


// Export router
module.exports = router