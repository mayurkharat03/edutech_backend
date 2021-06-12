const express = require('express');
const router = express.Router();
const paymentController = require('../controller/payment/paymentController')
const middleware = require('../utils/userAuth.middleware')
router.post('/initiatePayment', middleware.checkToken, paymentController.initiatePayment);
router.post('/createPaymentOrder', middleware.checkToken, paymentController.createPaymentOrder);

module.exports = router;