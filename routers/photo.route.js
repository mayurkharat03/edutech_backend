const express = require('express');
const router = express.Router();
const photoController = require('../controller/users/photoController')
const middleware = require('../utils/userAuth.middleware')
router.post('/:id/uploadProfilePhoto', photoController.upload, photoController.uploadProfilePhoto);
router.post('/:id/uploadAadhaarFrontPhoto', photoController.upload, photoController.uploadAadhaarFrontPhoto);
router.post('/:id/uploadAadhaarBackPhoto', photoController.upload, photoController.uploadAadhaarBackPhoto);
router.post('/:id/uploadPancardPhoto', photoController.upload, photoController.uploadPancardPhoto);



module.exports = router ;