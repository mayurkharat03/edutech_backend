const express = require('express');
const router = express.Router();
const adminController = require('../controller/admin/adminController');
const middleware = require('../utils/userAuth.middleware')

// Admin routes
router.post('/addUser', adminController.addAdminUser);
router.post('/getAdminLogin', adminController.getAdminLogin);

// User router
router.get('/getAllUsers', middleware.checkToken, adminController.getAllUsers);
router.get('/getPackageByUserId', middleware.checkToken, adminController.getAllUsers);

//Distributer routes


// Wallet routes


// Report routes


module.exports = router;