const { validationResult } = require('express-validator');
var logger = require('../../config/logger');
const dotenv = require('dotenv');
let result = dotenv.config();
const jwt = require('jsonwebtoken');
const axios = require('axios');
const bcrypt = require('bcrypt');
const saltRounds = 10;
if (result.error) {
    throw result.error;
}
const { parsed: env } = result;
const environment = process.env;
var db = require('../../config/database');


exports.addBankDetails = async function (req, res, next) {

    const { userId, bankName, accountNumber, accountName, ifscCode, upiId } = req.body;

    db.query(`INSERT INTO users_bank_details (user_id, bank_name, account_number, account_name, ifsc_code, upi_id, created_date, updated_date) VALUES (${userId}, '${bankName}', '${accountNumber}', '${accountName}', '${ifscCode}', '${upiId}', now(), now())`, (error, results) => {

        if (error) {

            return next(error);

        }

        if (results && results.insertId) {
            console.log('here ia mayur ')

            db.query(`UPDATE referral_code SET status = 1 where user_id = ${userId}`, async (errorReferralUpdate, resultsReferralUpdate) => {

                if (errorReferralUpdate) {

                    return next(errorReferralUpdate);

                }

                db.query(`SELECT * from referral_code where user_id = ${userId}`, (error, resultsReferral, fields) => {

                    if (error) {

                        return next(error);

                    }

                    resultsReferralUpdate.resultReferral = resultsReferral;

                    return res.status(200).json({ "message": 'Bank deatils added successfully', "userId": resultsReferralUpdate });

                })


            })

        }


    });

}