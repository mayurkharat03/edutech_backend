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


exports.addUser = async function (req, res, next) {

    const { salutation, firstName, middleName, lastName, email, password, phoneNumber, gender, billingAddress, shippingAddress, dateOfBirth, aadhaarCard, panCard, photo, referredBy } = req.body;

    const encryptedPassword = await bcrypt.hash(password, saltRounds);

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

                    })

                }

                return res.status(200).json({ "message": 'User added successfully', "userId": results.insertId });

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

    const phoneNumber = req.params.phoneNumber

    db.query(`SELECT id_user from users where phone_number = '${phoneNumber}'`, (error, results, fields) => {

        if (error) {

            return next(error);

        }

        if (results[0]) {

            return res.status(409).json({ "message": 'Phone number already exists' });

        } else {

            return res.status(200).json({ "message": 'OTP generated successfully', "result": '12345' });

        }

    });

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

                db.query(`SELECT * from users_session where user_id = '${results[0].id_user}'`, async (errorSession, resultsSession, fields) => {

                    if (errorSession) {

                        return next(errorSession);

                    }

                    if (resultsSession.length > 0) {

                        db.query(`UPDATE users_session SET session_token = '${accessToken}' where user_id = '${results[0].id_user}'`, async (errorSessionUpdate, resultsSessionUpdate) => {

                            if (errorSessionUpdate) {

                                return next(errorSessionUpdate);

                            }

                            return res.status(200).json({ "message": 'Login successfull', "result": results, "token": accessToken });

                        })

                    } else {

                        console.log(results[0].id_user);

                        db.query(`INSERT INTO users_session (user_id, session_token, created_date, updated_date) VALUES ('${results[0].id_user}', '${accessToken}', now(), now())`, (errorSessionInsert, resultsSessionInsert) => {
                            console.log(results[0].id_user);

                            if (errorSessionInsert) {

                                return next(errorSessionInsert);

                            }

                            return res.status(200).json({ "message": 'Login successfull', "result": results, "token": accessToken });

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