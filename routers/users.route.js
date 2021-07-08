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
router.get('/getOTPForForgotPassword/:mobileNumber', usersController.forgotPasswordGenerateOTP);
router.get('/verifyForgotPasswordOTP/:userId/:otp', usersController.verifyForgotPasswordOTP);
router.post('/changePassword', usersController.changePassword);
router.post('/checkEmailID', usersController.checkEmailId);
router.post('/updateUserDetails', middleware.checkToken, usersController.updateUserDetails);


module.exports = router;