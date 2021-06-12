const express = require('express');
const router = express.Router();
const usersController = require('../controller/users/usersController')
router.post('/addUser', usersController.addUser);
router.get('/verifyReferralCode/:code', usersController.verifyReferralCode);
router.get('/getOTPForRegistration/:phoneNumber', usersController.generateOTPForRegistration);
router.post('/getLogin', usersController.getLogin);
router.get('/verifyOTP/:phoneNumber/:otp', usersController.verifyOTP);


module.exports = router;