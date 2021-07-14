const express = require('express');
const router = express.Router();
const walletController = require('../controller/walletController/walletController');
const middleware = require('../utils/userAuth.middleware')
router.post('/requestTransfer', middleware.checkToken, walletController.requestTransfer);
router.get('/getWalletHistoryByUserId/:userId', middleware.checkToken, walletController.getWalletHistoryByUserId);
router.post('/makeWireTransferFromAdmin', middleware.checkToken, walletController.makeWireTransferFromAdmin);
router.get('/getAllWalletRequestForAdmin', middleware.checkToken, walletController.getAllWalletRequestForAdmin);


module.exports = router;