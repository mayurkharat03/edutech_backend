const express = require('express');
const router = express.Router();
const adminController = require('../controller/admin/adminController');
const middleware = require('../utils/userAuth.middleware')

// Admin routes
router.post('/addUser', adminController.addAdminUser);
router.post('/getAdminLogin', adminController.getAdminLogin);

// User router
router.put('/deleteUser', middleware.checkToken, adminController.deleteUser);
router.get('/getAllUsers', middleware.checkToken, adminController.getAllUsers);
router.get('/getUserById/:userId', middleware.checkToken, adminController.getUserById);
router.get('/searchAllUsers', middleware.checkToken, adminController.searchAllUsers);
router.get('/getAllUsersByKyc/:kycCompleted', middleware.checkToken, adminController.getAllUsersByKyc);
router.put('/userKycApproval/:id', middleware.checkToken, adminController.userKycApproval);
router.put('/distributorKycApproval/:id', middleware.checkToken, adminController.distributorKycApproval);

//Distributer routes
router.get('/getAllDistributors', middleware.checkToken, adminController.getAllDistributors);
router.get('/getDistributorById/:distributorId', middleware.checkToken, adminController.getDistributorById);
router.get('/searchAllDistributors', middleware.checkToken, adminController.searchAllDistributors);
router.get('/getAllDistributorsByKyc/:kycCompleted', middleware.checkToken, adminController.getAllDistributorsByKyc);
router.get('/getDistributorTreeById/:id', middleware.checkToken, adminController.getDistributorTreeById);

// Wallet routes

// Report routes


module.exports = router;