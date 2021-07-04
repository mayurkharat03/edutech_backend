const { validationResult } = require('express-validator');
var logger = require('../../config/logger');
const multer = require('multer')
const dotenv = require('dotenv');
let result = dotenv.config();
const jwt = require('jsonwebtoken');
const { parsed: env } = result;
const environment = process.env;
const AWS = require('aws-sdk');
const uuid = require('uuid');
var db = require('../../config/database');

if (result.error) {
    throw result.error;
}

const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ID,
    secretAccessKey: process.env.AWS_SECRET
})

const storage = multer.memoryStorage({
    destination: function (req, file, callback) {
        callback(null, '')
    }
})

exports.upload = multer({ storage }).single('image');


exports.uploadProfilePhoto = async function (req, res, next) {
    let userId = req.params.id;
    let profileImage = req.file.originalname.split(".")
    const fileType = profileImage[profileImage.length - 1]
    const params = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: `${userId}/${uuid.v4()}.${fileType}`,
        Body: req.file.buffer
    }

    s3.upload(params, async (error, data) => {
        if (error) {
            res.status(500).send(error)
        }



        db.query(`UPDATE users SET photo = '${params.Key}' where id_user = ${userId}`, async (errorSessionUpdate, resultsSessionUpdate) => {

            if (errorSessionUpdate) {

                return next(errorSessionUpdate);

            }

            return res.status(200).json({ "message": 'Profile uploaded successfully', "result": resultsSessionUpdate });

        })

    })
}


exports.uploadAadhaarFrontPhoto = async function (req, res, next) {
    let userId = req.params.id;
    let profileImage = req.file.originalname.split(".")
    const fileType = profileImage[profileImage.length - 1]
    const params = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: `${userId}/${uuid.v4()}.${fileType}`,
        Body: req.file.buffer
    }

    s3.upload(params, async (error, data) => {
        if (error) {
            res.status(500).send(error)
        }



        db.query(`UPDATE users SET aadhaar_front = '${params.Key}' where id_user = ${userId}`, async (errorSessionUpdate, resultsSessionUpdate) => {

            if (errorSessionUpdate) {

                return next(errorSessionUpdate);

            }

            return res.status(200).json({ "message": 'Aadhaar Front uploaded successfully', "result": resultsSessionUpdate });

        })

    })
}

exports.uploadAadhaarBackPhoto = async function (req, res, next) {
    let userId = req.params.id;
    let profileImage = req.file.originalname.split(".")
    const fileType = profileImage[profileImage.length - 1]
    const params = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: `${userId}/${uuid.v4()}.${fileType}`,
        Body: req.file.buffer
    }

    s3.upload(params, async (error, data) => {
        if (error) {
            res.status(500).send(error)
        }



        db.query(`UPDATE users SET aadhaar_back = '${params.Key}' where id_user = ${userId}`, async (errorSessionUpdate, resultsSessionUpdate) => {

            if (errorSessionUpdate) {

                return next(errorSessionUpdate);

            }

            return res.status(200).json({ "message": 'Aadhaar Back uploaded successfully', "result": resultsSessionUpdate });

        })

    })
}


exports.uploadPancardPhoto = async function (req, res, next) {
    let userId = req.params.id;
    let profileImage = req.file.originalname.split(".")
    const fileType = profileImage[profileImage.length - 1]
    const params = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: `${userId}/${uuid.v4()}.${fileType}`,
        Body: req.file.buffer
    }

    s3.upload(params, async (error, data) => {
        if (error) {
            res.status(500).send(error)
        }



        db.query(`UPDATE users SET pancard_photo = '${params.Key}' where id_user = ${userId}`, async (errorSessionUpdate, resultsSessionUpdate) => {

            if (errorSessionUpdate) {

                return next(errorSessionUpdate);

            }

            return res.status(200).json({ "message": 'Pancard uploaded successfully', "result": resultsSessionUpdate });

        })

    })
}

