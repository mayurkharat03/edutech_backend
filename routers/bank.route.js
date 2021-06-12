const express = require('express');
const router = express.Router();
const bankController = require('../controller/bank/bankController')
const middleware = require('../utils/userAuth.middleware')
router.post('/addBankDetails', middleware.checkToken, bankController.addBankDetails);
// router.post('/:id/uploadAadhaarFrontPhoto', middleware.checkToken, photoController.upload, photoController.uploadAadhaarFrontPhoto);
// router.post('/:id/uploadAadhaarBackPhoto', middleware.checkToken, photoController.upload, photoController.uploadAadhaarBackPhoto);
// router.post('/:id/uploadPancardPhoto', middleware.checkToken, photoController.upload, photoController.uploadPancardPhoto);



module.exports = router ;