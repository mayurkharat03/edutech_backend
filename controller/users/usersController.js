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


exports.addUser = async function (req, res, next) {

    console.log('request', req.body);

    const { salutation, firstName, middleName, lastName, email, password, phoneNumber, gender, billingAddress, shippingAddress, dateOfBirth, aadhaarCard, panCard, photo, referredBy } = req.body;

    const encryptedPassword = await bcrypt.hash(password, saltRounds);
    const accessToken = jwt.sign({ username: email, password: password }, environment.JWT_SECRET);


    db.query(`SELECT * from users where email = '${email}'`, (errorUser, resultsUser, fields) => {

        if (errorUser) {

            return next(errorUser);

        }

        if (resultsUser[0]) {

            return res.status(409).json({ "message": 'Emailid already exists' });

        } else {

            db.query(`INSERT INTO users (salutation, first_name, middle_name, last_name, email, password, phone_number, gender, billing_address, shipping_address, date_of_birth, aadhaar_card, pan_card, photo, referred_by, created_date, updated_date) VALUES ('${salutation}', '${firstName}', '${middleName}', '${lastName}', '${email}', '${encryptedPassword}', '${phoneNumber}', '${gender}', '${billingAddress}', '${shippingAddress}', '${dateOfBirth}', '${aadhaarCard}', '${panCard}', '${photo}', ${referredBy}, now(), now())`, (error, results) => {

                if (error) {

                    return next(error);

                }

                if (results && results.insertId) {

                    let referralCode = `${firstName.substring(0, 2).toUpperCase()}${(results.insertId).toPrecision(8).split('.').reverse().join('')}${Math.floor(Math.random() * 90 + 10)}`

                    db.query(`INSERT INTO referral_code (code, user_id, created_date, updated_date) VALUES ('${referralCode}', '${results.insertId}', now(), now())`, (errorReferral, resultsReferral) => {

                        if (errorReferral) {

                            return next(errorReferral);

                        }

                        db.query(`INSERT INTO users_tree (user_id, referral_user_id, created_date, updated_date) VALUES (${results.insertId}, ${referredBy}, now(), now())`, (errorUsersTree, resultsUsersTree) => {

                            if (errorUsersTree) {

                                return next(errorUsersTree);

                            }

                            db.query(`INSERT INTO users_session (user_id, session_token, generated_session_time, session_timeout, created_date, updated_time) VALUES (${results.insertId}, '${accessToken}',now(), now(), now(), now())`, (errorSessionInsert, resultsSessionInsert) => {
                                // console.log(results[0].id_user, errorSessionInsert);

                                if (errorSessionInsert) {

                                    return next(errorSessionInsert);

                                }

                                return res.status(200).json({ "message": 'User added successfully', "userId": results.insertId, "token": accessToken });
                            })


                        })

                    })

                }

            });

        }
    });

}

exports.verifyReferralCode = function (req, res, next) {

    const referralCode = req.params.code
    const userId = referralCode.substring(2, 10).replace(/^0+/, '');

    db.query(`SELECT * from referral_code where user_id = '${userId}' and code = '${referralCode}'`, (error, results, fields) => {

        if (error) {

            return next(error);

        }

        if (results[0]) {

            return res.status(200).json({ "message": 'Referral Code Verified', "result": results });

        } else {

            return res.status(401).json({ "message": 'Referral code is not matching', "result": results });

        }

    });

}

exports.generateOTPForRegistration = function (req, res, next) {

    const phoneNumber = req.params.phoneNumber;
    const generatedOTP = Math.floor(1000 + Math.random() * 9000);

    db.query(`SELECT id_user from users where phone_number = '${phoneNumber}'`, (error, results, fields) => {

        if (error) {

            return next(error);

        }

        if (results[0]) {

            return res.status(409).json({ "message": 'Phone number already exists' });

        } else {

            axios.post(`http://smpp.webtechsolution.co/http-jsonapi.php?senderid=LEARNW&route=1&templateid=1207162070319712893&authentic-key=34344c6561726e77656c6c3937301620031366&number=${phoneNumber}&message=Hello,%20Your%20OTP%20for%20Login%20is%20${generatedOTP}%20Thank%20You,Learn%20Well%20Technocraft&username=Learnwell&password=Learnwell`)
                .then(response => {
                    console.log(response.data.Code);
                    if (response.data.Code == '001') {
                        const messageId = 'response.data.Message-Id';
                        db.query(`SELECT * from otp_verification where phone_number = '${phoneNumber}'`, (error, resultsOTP, fields) => {

                            if (resultsOTP[0]) {

                                db.query(`UPDATE otp_verification SET message_id = '${messageId}', otp = '${generatedOTP}' where phone_number = ${phoneNumber}`, async (errorOTPUpdate, resultsOTPUpdate) => {

                                    if (errorOTPUpdate) {

                                        return next(errorOTPUpdate);

                                    }

                                    return res.status(200).json({ "message": 'OTP Sent Successfully' });

                                })

                            } else {
                                console.log('i am here');

                                db.query(`INSERT INTO otp_verification (phone_number, message_id, otp, generated_time, created_date, updated_time) VALUES ('${phoneNumber}', '${messageId}', '${generatedOTP}', now(), now(), now())`, (errorOTPInsert, resultsOTPInsert) => {

                                    if (errorOTPInsert) {

                                        return next(errorOTPInsert);

                                    }

                                    return res.status(200).json({ "message": 'OTP Sent Successfully' });

                                })

                            }

                        })

                    } else {

                        return res.status(401).json({ "message": 'Can not send OTP' });

                    }
                    // console.log(response.data.explanation);
                })
                .catch(error => {
                    console.log(error);
                });

            // return res.status(200).json({ "message": 'OTP generated successfully', "result": '12345' });

        }

    });

}

exports.verifyOTP = function (req, res, next) {

    const phoneNumber = req.params.phoneNumber;
    const otpValue = req.params.otp;

    db.query(`SELECT * from otp_verification where phone_number = '${phoneNumber}'`, (error, results, fields) => {

        if (error) {

            return next(error);

        }

        if (results[0]) {

            if (results[0].otp == otpValue) {

                return res.status(200).json({ "message": 'OTP Verified Successfully' });

            } else {

                return res.status(401).json({ "message": 'Invalid OTP' });

            }

        } else {

            return res.status(401).json({ "message": 'Invalid phone number' });

        }
    })


}

exports.getLogin = function (req, res, next) {

    const username = req.body.username;
    const password = req.body.password;

    db.query(`SELECT * from users where email = '${username}'`, async (error, results, fields) => {

        if (error) {

            return next(error);

        }

        if (results.length > 0) {

            const comparison = await bcrypt.compare(password, results[0].password);
            const accessToken = jwt.sign({ username: username, password: password }, environment.JWT_SECRET);

            if (comparison) {
                // console.log('comparison', comparison);
                db.query(`SELECT * from users_session where user_id = ${results[0].id_user}`, async (errorSession, resultsSession, fields) => {

                    if (errorSession) {

                        return next(errorSession);

                    }

                    if (resultsSession.length > 0) {
                        // console.log('resultsSession', resultsSession);
                        db.query(`UPDATE users_session SET session_token = '${accessToken}' where user_id = ${results[0].id_user}`, async (errorSessionUpdate, resultsSessionUpdate) => {

                            if (errorSessionUpdate) {

                                return next(errorSessionUpdate);

                            }

                            db.query(`SELECT * from package_purchase where user_id = ${results[0].id_user} and status=1`, async (errorPackagePurchase, resultsPackagePurchase, fields) => {

                                if (errorPackagePurchase) {

                                    return next(errorPackagePurchase);

                                }

                                if (resultsPackagePurchase.length > 0) {

                                    results[0].isPackagePurchase = 1;

                                } else {

                                    results[0].isPackagePurchase = 0;

                                }



                                db.query(`SELECT * from referral_code where user_id = ${results[0].id_user}`, async (errorReferralCode, resultsReferralCode, fields) => {

                                    if (errorReferralCode) {

                                        return next(errorReferralCode);

                                    }

                                    results[0].isAadhaarFrontUploaded = results[0].aadhaar_front == null || 'undefined' ? 0 : 1;
                                    results[0].isAadhaarBackUploaded = results[0].aadhaar_back == null || 'undefined' ? 0 : 1;
                                    results[0].isPanUploaded = results[0].pancard_photo == null || 'undefined' ? 0 : 1;
                                    results[0].isProfileUploaded = results[0].photo == null || 'undefined' ? 0 : 1;
                                    results[0].referralStatus = resultsReferralCode[0].status;

                                    return res.status(200).json({ "message": 'Login successfull', "result": results, "token": accessToken });


                                })

                            })

                        })

                    } else {

                        // console.log('results',results);

                        db.query(`INSERT INTO users_session (user_id, session_token, generated_session_time, session_timeout, created_date, updated_time) VALUES (${results[0].id_user}, '${accessToken}',now(), now(), now(), now())`, (errorSessionInsert, resultsSessionInsert) => {
                            // console.log(results[0].id_user, errorSessionInsert);

                            if (errorSessionInsert) {

                                return next(errorSessionInsert);

                            }

                            db.query(`SELECT * from package_purchase where user_id = ${results[0].id_user} and status=1`, async (errorPackagePurchase, resultsPackagePurchase, fields) => {

                                if (errorPackagePurchase) {

                                    return next(errorPackagePurchase);

                                }

                                if (resultsPackagePurchase.length > 0) {

                                    results[0].isPackagePurchase = 1;

                                } else {

                                    results[0].isPackagePurchase = 0;

                                }

                                db.query(`SELECT * from referral_code where user_id = ${results[0].id_user}`, async (errorReferralCode, resultsReferralCode, fields) => {

                                    if (errorReferralCode) {

                                        return next(errorReferralCode);

                                    }

                                    results[0].isAadhaarFrontUploaded = results[0].aadhaar_front == null ? false : true;
                                    results[0].isAadhaarBackUploaded = results[0].aadhaar_back == null ? false : true;
                                    results[0].isPanUploaded = results[0].pancard_photo == null ? false : true;
                                    results[0].isProfileUploaded = results[0].photo == null || undefined ? false : true;
                                    results[0].referralStatus = resultsReferralCode[0].status;

                                    return res.status(200).json({ "message": 'Login successfull', "result": results, "token": accessToken });


                                })
                            })
                        })

                    }

                })

            } else {

                return res.status(401).json({ "message": 'Username or password is wrong' });

            }


        } else {

            return res.status(401).json({ "message": 'Username does not exists' });

        }

    });

}


exports.getDashboardDetails = function (req, res, next) {

    const userId = req.params.userId;
    // const password = req.body.password;

    db.query(`SELECT * from users where id_user = ${userId}`, async (error, results, fields) => {

        if (results.length > 0) {

            db.query(`SELECT * from package_purchase where user_id = ${results[0].id_user} and status=1`, async (errorPackagePurchase, resultsPackagePurchase, fields) => {

                if (errorPackagePurchase) {

                    return next(errorPackagePurchase);

                }

                if (resultsPackagePurchase.length > 0) {

                    results[0].isPackagePurchase = 1;

                } else {

                    results[0].isPackagePurchase = 0;

                }



                db.query(`SELECT * from referral_code where user_id = ${results[0].id_user}`, async (errorReferralCode, resultsReferralCode, fields) => {

                    if (errorReferralCode) {

                        return next(errorReferralCode);

                    }

                    results[0].isAadhaarFrontUploaded = results[0].aadhaar_front == null || 'undefined' ? 0 : 1;
                    results[0].isAadhaarBackUploaded = results[0].aadhaar_back == null || 'undefined' ? 0 : 1;
                    results[0].isPanUploaded = results[0].pancard_photo == null || 'undefined' ? 0 : 1;
                    results[0].isProfileUploaded = results[0].photo == null || 'undefined' ? 0 : 1;
                    results[0].referralStatus = resultsReferralCode[0].status;
                    results[0].resultReferral = resultsReferralCode;
                    results[0].resultReferral[0].walletAmount = 0;

                    return res.status(200).json({ "message": 'Dashboard Details', "result": results });


                })
            })
        } else {

            return res.status(200).json({ "message": 'User Doest Not Exist!' });

        }
    })

}
