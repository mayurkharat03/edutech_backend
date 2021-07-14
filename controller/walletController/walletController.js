const { validationResult } = require('express-validator');
var logger = require('../../config/logger');
const dotenv = require('dotenv');
let result = dotenv.config();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const saltRounds = 10;
if (result.error) {
    throw result.error;
}
const { parsed: env } = result;
const environment = process.env;
var db = require('../../config/database');
const crypto = require("crypto");
var sha512 = require('js-sha512');
const axios = require('axios');





exports.requestTransfer = async function (req, res, next) {

    // console.log('request', req.body);

    const { userId, beneficiaryType, beneficiaryName, accountNumber, ifsc, upiHandle, paymentMode, amount, email, phoneNumber, narration } = req.body;
    const uniqueRequestNumber = crypto.randomBytes(16).toString("hex");

    db.query(`SELECT * from referral_code where user_id = ${userId}`, (errorUser, resultsUser, fields) => {

        if (errorUser) {

            return next(errorUser);

        }

        if (resultsUser[0]) {

            if (parseFloat(amount) <= parseFloat(resultsUser[0].wallet_amount)) {

                if (parseFloat(amount) >= 10000.00 || parseFloat(amount) >= 10000) {

                    db.query(`INSERT INTO wallet_request (user_id, beneficiary_type, beneficiary_name, account_number, ifsc, upi_handle, unique_request_number, payment_mode, amount, email, phone, narration, request_status, created_at, updated_at) VALUES (${userId}, '${beneficiaryType}', '${beneficiaryName}', '${accountNumber}', '${ifsc}', '${upiHandle}', '${uniqueRequestNumber}', '${paymentMode}', '${amount}', '${email}', '${phoneNumber}', '${narration}', 0, now(), now())`, (errorOTPInsert, resultsOTPInsert) => {

                        if (errorOTPInsert) {

                            return next(errorOTPInsert);

                        }

                        return res.status(200).json({ "message": 'Wallet Transfer Request Generated Successfully!' });

                    })
                } else {

                    db.query(`INSERT INTO wallet_request (user_id, beneficiary_type, beneficiary_name, account_number, ifsc, upi_handle, unique_request_number, payment_mode, amount, email, phone, narration, request_status, created_at, updated_at) VALUES (${userId}, '${beneficiaryType}', '${beneficiaryName}', '${accountNumber}', '${ifsc}', '${upiHandle}', '${uniqueRequestNumber}', '${paymentMode}', '${amount}', '${email}', '${phoneNumber}', '${narration}', 0, now(), now())`, (errorOTPInsert, resultsOTPInsert) => {

                        if (errorOTPInsert) {

                            return next(errorOTPInsert);

                        }

                        var hashstring = process.env.WIRE_KEY + "|" + accountNumber + "|" + ifsc + "|" + upiHandle + "|" + uniqueRequestNumber + "|" + 1.00 +
                            "|" + process.env.WIRE_SALT;
                        console.log('hashstring', hashstring);
                        hashstring = sha512.sha512(hashstring);


                        let payloadData = {
                            key: process.env.WIRE_KEY,
                            beneficiary_type: beneficiaryType,
                            beneficiary_name: beneficiaryName,
                            account_number: accountNumber,
                            ifsc: ifsc,
                            upi_handle: upiHandle,
                            unique_request_number: uniqueRequestNumber,
                            payment_mode: paymentMode,
                            amount: amount,
                            email: email,
                            phone: phoneNumber,
                            narration: narration
                        }

                        let headerConfig = {
                            headers: {
                                Authorization: sha512.sha512(hashstring),
                            }
                        }

                        console.log('amount trasfer');

                        axios.post(`https://wire.easebuzz.in/api/v1/quick_transfers/initiate/`, payloadData, headerConfig)
                            .then(response => {
                                console.log('my response data', response);
                                if (response.success == true) {

                                    db.query(`UPDATE referral_code SET wallet_amount = wallet_amount - '${amount}' where user_id = ${userId}`, async (errorPasswordUpdate, resultsPasswordUpdate) => {

                                        db.query(`UPDATE wallet_request SET request_status = 1 where user_id = ${userId} and unique_request_number = '${uniqueRequestNumber}'`, async (errorPasswordUpdate2, resultsPasswordUpdate2) => {

                                            db.query(`INSERT INTO wallet_transaction (user_id, wire_id, unique_request_number, failure_reason, beneficiary_id, created_at, unique_transaction_reference, payment_mode, amount, currency, narration, beneficiary_account_name, beneficiary_account_number, beneficiary_account_ifsc, beneficiary_upi_handle, service_charge, gst_amount, service_charge_with_gst, status, record_created_at, updated_at) VALUES (${userId}, '${response.data.transfer_request.id}', '${response.data.transfer_request.unique_request_number}', '${response.data.transfer_request.failure_reason}', '${response.data.transfer_request.beneficiary_id}', '${response.data.transfer_request.created_at}', '${response.data.transfer_request.unique_transaction_reference}', '${response.data.transfer_request.payment_mode}', '${response.data.transfer_request.amount}', '${response.data.transfer_request.currency}', '${response.data.transfer_request.narration}', '${response.data.transfer_request.beneficiary_bank_name}', '${response.data.transfer_request.beneficiary_account_name}', '${response.data.transfer_request.beneficiary_account_number}', '${response.data.transfer_request.beneficiary_account_ifsc}', '${response.data.transfer_request.beneficiary_upi_handle}', '${response.data.transfer_request.service_charge}', '${response.data.transfer_request.gst_amount}', '${response.data.transfer_request.service_charge_with_gst}', '${response.data.transfer_request.status}', now(), now())`, (errorOTPInsert2, resultsOTPInsert2) => {

                                                if (errorOTPInsert2) {

                                                    return next(errorOTPInsert2);

                                                }

                                                return res.status(200).json({ "message": 'Wallet Transfer Successfully!', result: response.data });

                                            })

                                        })

                                    })




                                } else {

                                    return res.status(400).json({ "message": 'Wallet Transfer Request Failed!', result: response });

                                }
                            })
                            .catch(error => {

                                // console.log(error);
                                return res.status(400).json({ "message": 'Wallet Transfer Request Failed!', result: error });
                            });



                        // return res.status(200).json({ "message": 'Wallet Transfer Request Generated Successfully!' });

                    })

                }


            } else {

                return res.status(400).json({ "message": 'Amount not matching!' });

            }

        } else {

            return res.status(400).json({ "message": 'User Does Not exist!' });

        }
    });

}

exports.makeWireTransferFromAdmin = function (req, res, next) {


    const { userId, uniqueRequestNumber, beneficiaryType, beneficiaryName, accountNumber, ifsc, upiHandle, paymentMode, amount, email, phoneNumber, narration } = req.body;
    db.query(`SELECT * from wallet_request where unique_request_number = '${uniqueRequestNumber}'`, (errorUser, resultsUser, fields) => {
        console.log('makeWireTransferFromAdmin', errorUser, resultsUser);
        if (errorUser) {

            return next(errorUser);

        }

        if (resultsUser.length > 0) {

            var hashstring = process.env.WIRE_KEY + "|" + accountNumber + "|" + ifsc + "|" + upiHandle + "|" + uniqueRequestNumber + "|" + amount +
                "|" + process.env.WIRE_SALT;
            console.log('hashstring', hashstring);
            hashstring = sha512.sha512(hashstring);


            let payloadData = {
                key: process.env.WIRE_KEY,
                beneficiary_type: beneficiaryType,
                beneficiary_name: beneficiaryName,
                account_number: accountNumber,
                ifsc: ifsc,
                upi_handle: upiHandle,
                unique_request_number: uniqueRequestNumber,
                payment_mode: paymentMode,
                amount: amount,
                email: email,
                phone: phoneNumber,
                narration: narration
            }

            let headerConfig = {
                headers: {
                    Authorization: sha512.sha512(hashstring),
                }
            }

            console.log('amount trasfer');

            axios.post(`https://wire.easebuzz.in/api/v1/quick_transfers/initiate/`, payloadData, headerConfig)
                .then(response => {
                    // console.log('my response data', response);
                    if (response.success == true) {

                        db.query(`UPDATE referral_code SET wallet_amount = wallet_amount - '${amount}' where user_id = ${userId}`, async (errorPasswordUpdate, resultsPasswordUpdate) => {

                            db.query(`UPDATE wallet_request SET request_status = 1 where user_id = ${userId} and unique_request_number = '${uniqueRequestNumber}'`, async (errorPasswordUpdate2, resultsPasswordUpdate2) => {

                                db.query(`INSERT INTO wallet_transaction (user_id, wire_id, unique_request_number, failure_reason, beneficiary_id, created_at, unique_transaction_reference, payment_mode, amount, currency, narration, beneficiary_account_name, beneficiary_account_number, beneficiary_account_ifsc, beneficiary_upi_handle, service_charge, gst_amount, service_charge_with_gst, status, record_created_at, updated_at) VALUES (${userId}, '${response.data.transfer_request.id}', '${response.data.transfer_request.unique_request_number}', '${response.data.transfer_request.failure_reason}', '${response.data.transfer_request.beneficiary_id}', '${response.data.transfer_request.created_at}', '${response.data.transfer_request.unique_transaction_reference}', '${response.data.transfer_request.payment_mode}', '${response.data.transfer_request.amount}', '${response.data.transfer_request.currency}', '${response.data.transfer_request.narration}', '${response.data.transfer_request.beneficiary_bank_name}', '${response.data.transfer_request.beneficiary_account_name}', '${response.data.transfer_request.beneficiary_account_number}', '${response.data.transfer_request.beneficiary_account_ifsc}', '${response.data.transfer_request.beneficiary_upi_handle}', '${response.data.transfer_request.service_charge}', '${response.data.transfer_request.gst_amount}', '${response.data.transfer_request.service_charge_with_gst}', '${response.data.transfer_request.status}', now(), now())`, (errorOTPInsert2, resultsOTPInsert2) => {

                                    if (errorOTPInsert2) {

                                        return next(errorOTPInsert2);

                                    }

                                    return res.status(200).json({ "message": 'Wallet Transfer Successfully!', result: response.data });

                                })

                            })

                        })




                    } else {

                        return res.status(400).json({ "message": 'Wallet Transfer Request Failed!', result: response });

                    }
                })
                .catch(error => {

                    // console.log(error);
                    return res.status(400).json({ "message": 'Wallet Transfer Request Failed!', result: error });
                });

        } else {

            return res.status(400).json({ "message": 'Transaction does not exist!' });

        }


    })

}



exports.getWalletHistoryByUserId = function (req, res, next) {

    const userId = req.params.userId;

    db.query(`SELECT * from wallet_request where user_id = '${userId}'`, (error, results, fields) => {

        if (error) {

            return next(error);

        }

        if (results) {

            return res.status(200).json({ "message": 'Wallet transaction history!', result: results });

        } else {

            return res.status(401).json({ "message": 'User does not exist!' });

        }
    })

}


exports.getAllWalletRequestForAdmin = function (req, res, next) {

    db.query(`SELECT * from wallet_request where amount >= '10' and request_status = 0`, (error, results, fields) => {

        if (error) {

            return next(error);

        }


        if (results) {

            return res.status(200).json({ "message": 'Wallet Request!', result: results });

        } else {

            return res.status(401).json({ "message": 'Wallet Request does not exist!' });

        }
    })

}
