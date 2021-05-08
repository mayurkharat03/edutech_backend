const express = require('express');
const router = express.Router();
const packageController = require('../controller/packages/packageController')
const middleware = require('../utils/userAuth.middleware')
router.get('/getBoards', middleware.checkToken, packageController.getBoards);
router.get('/getStandardsByBoardId/:boardId', middleware.checkToken, packageController.getStandardsByBoardId);
router.post('/addPackage', middleware.checkToken, packageController.addPackage);
router.post('/addStudent', middleware.checkToken, packageController.addStudent);
router.get('/getPackageByUserId/:userId', middleware.checkToken, packageController.getPackageByUserId);
// router.get('/getOTPForRegistration/:phoneNumber', packageController.generateOTPForRegistration);
// router.post('/getLogin', packageController.getLogin);


module.exports = router;