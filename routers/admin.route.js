const express = require('express');
const router = express.Router();
const adminController = require('../controller/admin/adminController');
const middleware = require('../utils/userAuth.middleware')

// Admin routes
router.post('/addUser', adminController.addAdminUser);
router.post('/getAdminLogin', adminController.getAdminLogin);

// User router
router.get('/userDelete', middleware.checkToken, adminController.deleteUser);
router.get('/getAllUsers', middleware.checkToken, adminController.getAllUsers);
router.get('/getPackageByUserId', middleware.checkToken, adminController.getAllUsers);

//Distributer routes


// Wallet routes
router.get('/getWalletDetailsByUserId', middleware.checkToken, adminController.getWalletDetailsByUserId);

// Report routes


module.exports = router;