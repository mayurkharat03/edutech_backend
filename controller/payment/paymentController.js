var util = require('../../utils/paymentUtil.js');
const crypto = require("crypto");
var sha512 = require('js-sha512');
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
const axios = require('axios');




exports.initiatePayment = async function (req, res, next) {

    const data = req.body;

    function form() {
        form = {
            'key': process.env.MERCHANT_KEY,
            'txnid': data.txnid,
            'amount': data.amount,
            'email': data.email,
            'phone': data.phone,
            'firstname': data.name,
            'udf1': data.udf1,
            'udf2': data.udf2,
            'udf3': data.udf3,
            'udf4': data.udf4,
            'udf5': data.udf5,
            'hash': hash_key,
            'productinfo': data.productinfo,
            'udf6': data.udf6,
            'udf7': data.udf7,
            'udf8': data.udf8,
            'udf9': data.udf9,
            'udf10': data.udf10,
            'furl': data.furl, //'http://localhost:3000/response',
            'surl': data.surl, //'http://localhost:3000/response'
        }
        // if (data.unique_id != '') {
        //     form.unique_id = data.unique_id
        // }


        // if (data.split_payments != '') {
        //     form.split_payments = data.split_payments
        // }

        // if (data.sub_merchant_id != '') {
        //     form.sub_merchant_id = data.sub_merchant_id
        // }

        // if (data.customer_authentication_id != '') {
        //     form.customer_authentication_id = data.customer_authentication_id
        // }

        return form;
    }

    var hash_key = generateHash();
    console.log('hash_key', hash_key);
    console.log('process.env.TEST_PAY_URL', process.env.TEST_PAY_URL);
    payment_url = process.env.TEST_PAY_URL;
    call_url = payment_url + '/payment/initiateLink';
    console.log('payload payment', call_url);
    util.call(call_url, form()).then(function (response) {
        console.log('response.data', response.data);
        pay(response.data, payment_url)
    });


    function pay(access_key, url_main) {

        // if (process.env.enable_iframe == 0) {
        var url = url_main + 'pay/' + access_key;
        return res.redirect(url);
        // } else {

        //     res.render("enable_iframe.html", {
        //         'key': process.env.MERCHANT_KEY,
        //         'access_key': access_key
        //     });

        // }
    }


    function generateHash() {

        var hashstring = process.env.MERCHANT_KEY + "|" + data.txnid + "|" + data.amount + "|" + data.productinfo + "|" + data.name + "|" + data.email +
            "|" + data.udf1 + "|" + data.udf2 + "|" + data.udf3 + "|" + data.udf4 + "|" + data.udf5 + "|" + data.udf6 + "|" + data.udf7 + "|" + data.udf8 + "|" + data.udf9 + "|" + data.udf10;
        hashstring += "|" + process.env.EASEBUZZ_SALT;
        console.log('hashstring', hashstring);
        data.hash = sha512.sha512(hashstring);
        return (data.hash);
    }

}

exports.createPaymentOrder = async function (req, res, next) {

    const transactionID = crypto.randomBytes(16).toString("hex");
    // console.log('transactionID', transactionID);
    const { userId, amount, email, phone, firstname, udf1, udf2, udf3, udf4, udf5, productinfo, udf6, udf7, udf8, udf9, udf10, address1, address2, city, state, country, zipcode } = req.body;
    // console.log('req.body', process.env.MERCHANT_KEY + "|" + transactionID + "|" + amount + "|" + productinfo + "|" + firstname + "|" + email + "|" + udf1 + "|" + udf2 + "|" + udf3 + "|" + udf4 + "|" + udf5 + "|" + udf6 + "|" + udf7 + "|" + udf8 + "|" + udf9 + "|" + udf10 + "|" + process.env.EASEBUZZ_SALT + "|" + process.env.MERCHANT_KEY);
    const paymentHashKey = sha512.sha512(process.env.MERCHANT_KEY + "|" + transactionID + "|" + amount + "|" + productinfo + "|" + firstname + "|" + email + "|" + udf1 + "|" + udf2 + "|" + udf3 + "|" + udf4 + "|" + udf5 + "|" + udf6 + "|" + udf7 + "|" + udf8 + "|" + udf9 + "|" + udf10 + "|" + process.env.EASEBUZZ_SALT + "|" + process.env.MERCHANT_KEY);
    // console.log('hashkey', paymentHashKey);
    db.query(`INSERT INTO payment_order_details (user_id, package_id_list, transaction_id, amount, email, first_name, udf1, udf2, udf3, udf4, udf5, udf6, udf7, udf8, udf9, udf10, address1, address2, city, state, country, zipcode, payment_hash_key, status, payment_date, created_date, updated_date) VALUES (${userId}, '${productinfo}', '${transactionID}', '${amount}', '${email}', '${firstname}', '${udf1}', '${udf2}', '${udf3}', '${udf4}', '${udf5}', '${udf6}', '${udf7}', '${udf8}', '${udf9}', '${udf10}', '${address1}', '${address2}', '${city}', '${state}', '${country}', '${zipcode}', '${paymentHashKey}', 0, now(), now(), now())`, (errorPaymentOrder, resultsPaymentOrder) => {

        if (errorPaymentOrder) {
            // console.log('errorPaymentOrder', errorPaymentOrder);
            return next(errorPaymentOrder);

        }

        if (resultsPaymentOrder && resultsPaymentOrder.insertId) {

            let packageIds = productinfo.trim().split(/\s*,\s*/);

            for (let i = 0; i < packageIds.length; i++) {

                db.query(`UPDATE package_purchase SET transaction_id = '${transactionID}' where id_package_purchase = ${packageIds[i]}`, async (errorPackageUpdate, resultsPackageUpdate) => {

                    if (errorPackageUpdate) {

                        return next(errorPackageUpdate);

                    }

                })
            }

            return res.status(200).json({ "message": 'Payment order created successfully', "result": { userId: userId, productInfo: productinfo, orderId: resultsPaymentOrder.insertId, transactionID: transactionID, paymentHashKey: paymentHashKey, merchantKey: process.env.MERCHANT_KEY, salt: process.env.EASEBUZZ_SALT, transactionStatus: 0, furl: process.env.FURL, surl: process.env.SURL } });

        }

    });

}

exports.confirmPaymentStatus = async function (req, res, next) {
    // console.log('inside cnfirm', req.body);
    // getSSOToken();

    const paymentStatus = req.body.status == 'success' ? 1 : 2;
    const packageStatus = req.body.status == 'success' ? 1 : 0;
    const productinfo = req.body.productinfo;

    console.log('productinfoproductinfo', paymentStatus, packageStatus, productinfo);
    if (req.body.status == 'success') {

        db.query(`UPDATE payment_order_details SET status = ${paymentStatus} where user_id = ${req.body.userId} AND transaction_id = '${req.body.txnid}'`, (errorPaymentOrder, resultsPaymentOrder) => {

            if (errorPaymentOrder) {
                // console.log('errorPaymentOrder', errorPaymentOrder);
                return next(errorPaymentOrder);

            }

            let packageIds = productinfo.trim().split(/\s*,\s*/);
            // console.log('errorPackageUpdate2');

            for (let i = 0; i < packageIds.length; i++) {
                // console.log('errorPackageUpdate1');

                db.query(`UPDATE package_purchase SET status = ${packageStatus} where id_package_purchase = ${packageIds[i]} AND transaction_id = '${req.body.txnid}'`, async (errorPackageUpdate, resultsPackageUpdate) => {
                    // console.log('errorPackageUpdate');
                    // console.log('errorPackageUpdate', errorPackageUpdate);
                    if (errorPackageUpdate) {

                        return next(errorPackageUpdate);

                    }

                })
            }

            db.query(`SELECT * from payment_details where transaction_id = '${req.body.txnid}' AND status = 'success'`, (errorUser, resultsUser, fields) => {

                if (errorUser) {

                    return next(errorUser);

                }

                if (resultsUser[0]) {
                    // console.log('resultsUser[0]', resultsUser[0]);
                    // divideCommissionInTree(req.body.userId, req.body.amount);
                    return res.status(200).json({ "message": 'Payment already done', "result": { results: req.body }, "paymentSuccessStatus": true });

                } else {


                    db.query(`INSERT INTO payment_details (user_id, transaction_id, easepayid, email, firstname, phone, amount, hash, status, flag, merchant_logo, cardCategory, error, addedon, mode, issuing_bank, cash_back_percentage, deduction_percentage, error_Message, payment_source, bank_ref_num, merchant_key, bankcode, unmappedstatus, net_amount_debit, card_type, cardnum, productinfo, PG_TYPE, name_on_card, created_at, updated_at) VALUES (${req.body.userId}, '${req.body.txnid}', '${req.body.easepayid}', '${req.body.email}', '${req.body.firstname}', '${req.body.phone}', '${req.body.amount}', '${req.body.hash}', '${req.body.status}', '${req.body.flag}', '${req.body.merchant_logo}', '${req.body.cardCategory}', '${req.body.error}', '${req.body.addedon}', '${req.body.mode}', '${req.body.issuing_bank}', '${req.body.cash_back_percentage}', '${req.body.deduction_percentage}', '${req.body.error_Message}', '${req.body.payment_source}', '${req.body.bank_ref_num}', '${req.body.key}', '${req.body.bankcode}','${req.body.unmappedstatus}','${req.body.net_amount_debit}','${req.body.card_type}','${req.body.cardnum}','${req.body.productinfo}','${req.body.PG_TYPE}','${req.body.name_on_card}', now(), now())`, (errorPaymentDetails, resultsPaymentDetails) => {

                        if (errorPaymentDetails) {
                            // console.log('errorPaymentDetails', errorPaymentDetails);
                            return next(errorPaymentDetails);

                        }
                        divideCommissionInTree(req.body.userId, req.body.amount);
                        sendTransactionDetailsToAllern(req.body);
                        return res.status(200).json({ "message": 'Payment successfully', "result": { results: req.body }, "paymentSuccessStatus": true });

                    })
                }

            })

        });

    } else {

        return res.status(200).json({ "message": 'Payment failed', "result": { results: req.body }, "paymentSuccessStatus": false });

    }

}


function getSSOToken() {

    axios.post(`http://devapi.alrn.in/Portal/GetSSOToken`, { "clientName": process.env.CLIENT_NAME, "clientId": process.env.CLIENT_ID })
        .then(response => {
            console.log('my response data', response);
        })
        .catch(error => {
            console.log(error);
        });

}

function divideCommissionInTree(userId, totalAmount) {

    let totalCommision = (totalAmount / 2).toFixed(2);
    let firstParent = ((totalCommision * 10) / 100).toFixed(2);
    let leftCommision = (totalCommision - firstParent).toFixed(2);
    console.log('totalCommision:::>', totalCommision, 'firstParent:::>', firstParent, 'leftCommision:::>', leftCommision);
    let arrayValues = [];

    recursiveCall(userId);

    function recursiveCall(user_id) {
        // console.log('user_id', user_id);

        db.query(`select  referral_user_id
                    from    (select * from users_tree
                            order by referral_user_id, id_users_tree) products_sorted,
                            (select @pv := ${user_id}) initialisation
                    where   find_in_set(user_id, @pv)
                    and     length(@pv := concat(@pv, ',', id_users_tree))`, async (error, results, fields) => {

            if (results.length > 0) {

                // console.log('arrayValues', results[0].referral_user_id);

                arrayValues.push(results[0].referral_user_id);
                recursiveCall(results[0].referral_user_id);


            } else {

                console.log('arrayValues end', arrayValues);

                if (arrayValues.length) {

                    let equalCommission = (leftCommision / arrayValues.length).toFixed(2);
                    console.log('equalCommission', equalCommission);

                    arrayValues.map((item, index) => {
                        if (index === 0) {

                            db.query(`UPDATE referral_code SET wallet_amount = wallet_amount + '${firstParent}', total_earning = total_earning + '${firstParent}' where user_id = ${item}`, async (errorPasswordUpdate, resultsPasswordUpdate) => {

                                // console.log(resultsPasswordUpdate);
                                // if (errorPasswordUpdate) {

                                //     return next(errorPasswordUpdate);

                                // }

                            })

                        }

                        db.query(`UPDATE referral_code SET wallet_amount = wallet_amount + '${equalCommission}', total_earning = total_earning + '${equalCommission}' where user_id = ${item}`, async (errorPasswordUpdate, resultsPasswordUpdate) => {

                            // if (errorPasswordUpdate) {

                            //     return next(errorPasswordUpdate);

                            // }

                        })

                    })

                } else {

                    let singleCommission = leftCommision;
                    console.log('singleCommission', singleCommission);

                }

            }
        })

    }

}


exports.getRecursiveTreeByUserId = async function (req, res, next) {

    const userId = req.params.userId;
    let arrayValues = [];

    recursiveCall(userId);

    function recursiveCall(user_id) {
        // console.log('user_id', user_id);

        db.query(`select  referral_user_id
                    from    (select * from users_tree
                            order by referral_user_id, id_users_tree) products_sorted,
                            (select @pv := ${user_id}) initialisation
                    where   find_in_set(user_id, @pv)
                    and     length(@pv := concat(@pv, ',', id_users_tree))`, async (error, results, fields) => {

            if (results.length > 0) {

                // console.log('arrayValues', results[0].referral_user_id);

                arrayValues.push(results[0].referral_user_id);
                recursiveCall(results[0].referral_user_id);


            } else {

                console.log('arrayValues end', arrayValues);
                return res.status(200).json({ "message": 'Parent seller chain user ids!', "result": arrayValues });

            }
        })

    }

}

exports.getWalletDetailsByUserId = async function (req, res, next) {

    const userId = req.params.userId;

    db.query(`SELECT * from referral_code where user_id = ${userId}`, async (error, results, fields) => {

        if (results.length > 0) {
            db.query(`SELECT * from users_bank_details where user_id = ${userId}`, async (errorBank, resultsBank, fields) => {

                results[0].bankDetails = resultsBank[0];

                db.query(`SELECT COUNT(*) AS immediateReferral FROM users_tree where referral_user_id = ${userId}`, async (error2, results2, fields) => {

                    if (results2) {

                        results[0].immediateReferralCount = results2[0].immediateReferral;
                        return res.status(200).json({ "message": 'Wallet Details!', "result": results[0] });

                    } else {

                        results[0].immediateReferralCount = 0;
                        return res.status(200).json({ "message": 'Wallet Details!', "result": results[0] });

                    }

                })

            })

        } else {

            return res.status(200).json({ "message": 'Wallet Details Does Not Exist!' });

        }

    })

}

async function getImmediateReferralByUserId(userId) {

    db.query(`SELECT COUNT(*) AS immediateReferral FROM users_tree where referral_user_id = ${userId}`, async (error, results, fields) => {

        if (results) {

            console.log('results', results);
            return results[0];

        } else {

            console.log('results empty');
            return 0;

        }

    })

}

async function sendTransactionDetailsToAllern(payloadData) {

    // let payloadData = req.body;
    let transactionDate = new Date();
    transactionDate = transactionDate.toISOString();

    axios.post(`http://devapi.alrn.in/Portal/GetSSOToken`, { "clientName": process.env.CLIENT_NAME, "clientId": process.env.CLIENT_ID })
        .then(response => {
            console.log('my response data', response.data);
            if (response.data.isSuccess == true) {

                db.query(`SELECT * from payment_order_details where transaction_id = '${payloadData.txnid}'`, async (error, results, fields) => {

                    console.log(error)

                    if (results[0]) {

                        let allernData = {
                            "transactionId": payloadData.txnid,
                            "customerName": payloadData.firstname,
                            "contactNo": payloadData.phone,
                            "email": payloadData.email,
                            "address1": results[0].address1,
                            "address2": results[0].address2,
                            "address3": "",
                            "city": results[0].city,
                            "state": results[0].state,
                            "pinCode": results[0].zipcode,
                            "transactionDate": transactionDate,
                            "transactionAmount": Number(payloadData.amount),
                            "invoiceNumber": payloadData.txnid,
                            "invoiceDate": transactionDate,
                            "gstTaxName": "GST",
                            "gstTaxBase": 0,
                            "gstTaxRateCGSTN": 0,
                            "gstTaxRateSGSTN": 0,
                            "gstTaxRateIGSTN": 0,
                            "gstTaxTotal": 0,
                            "gstTaxCGSTN": 0,
                            "gstTaxSGSTN": 0,
                            "gstTaxIGSTN": 0,
                            "productList": [
                                {
                                    "productId": payloadData.packagePurchaseList,
                                    "quantity": 1,
                                    "price": Number(payloadData.amount)
                                }
                            ]
                        }
                        // console.log(allernData, response.data.token);
                        let headerConfig = {
                            headers: {
                                Token: response.data.token,
                            }
                        }

                        axios.post(`http://devapi.alrn.in/Portal/PostTransaction`, allernData, headerConfig)
                            .then(responseData => {

                                console.log('my response data post call', responseData.data);

                                if (responseData.data.isSuccess === true) {

                                    // axios.post(`http://smpp.webtechsolution.co/http-jsonapi.php?senderid=LEARNW&route=1&templateid=1207162070319712893&authentic-key=34344c6561726e77656c6c3937301620031366&number=${phoneNumber}&message=Hello,%20Your%20Order%20has%20been%20place%20with%transaction%20number:%20Thank%20You,Learn%20Well%20Technocraft&username=Learnwell&password=Learnwell`)
                                    //     .then(response => {
                                    //         console.log(response.data.Code);
                                    //     })

                                }


                            })
                            .catch(errorData => {
                                console.log(errorData);
                            });


                    }

                })


            }
        })
        .catch(error => {
            console.log(error);
        });

}


