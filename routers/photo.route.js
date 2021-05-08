const express = require('express');
const router = express.Router();
const photoController = require('../controller/users/photoController')
const middleware = require('../utils/userAuth.middleware')
router.post('/:id/uploadProfilePhoto', middleware.checkToken, photoController.upload, photoController.uploadProfilePhoto);
router.post('/:id/uploadAadhaarFrontPhoto', middleware.checkToken, photoController.upload, photoController.uploadAadhaarFrontPhoto);
router.post('/:id/uploadAadhaarBackPhoto', middleware.checkToken, photoController.upload, photoController.uploadAadhaarBackPhoto);
router.post('/:id/uploadPancardPhoto', middleware.checkToken, photoController.upload, photoController.uploadPancardPhoto);



module.exports = router ;