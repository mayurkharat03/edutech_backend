const express = require('express');
const router = express.Router();
const usersController = require('../controller/users/usersController');
const middleware = require('../utils/userAuth.middleware')
router.post('/addUser', usersController.addUser);
router.get('/verifyReferralCode/:code', usersController.verifyReferralCode);
router.get('/getOTPForRegistration/:phoneNumber', usersController.generateOTPForRegistration);
router.post('/getLogin', usersController.getLogin);
router.get('/verifyOTP/:phoneNumber/:otp', usersController.verifyOTP);
router.get('/getDashBoardDetailsByUserId/:userId', middleware.checkToken, usersController.getDashboardDetails);

module.exports = router;