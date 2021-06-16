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
    console.log('transactionID', transactionID);
    const { userId, amount, email, phone, firstname, udf1, udf2, udf3, udf4, udf5, productinfo, udf6, udf7, udf8, udf9, udf10, address1, address2, city, state, country, zipcode } = req.body;
    console.log('req.body', req.body, userId, amount, email, phone, firstname, udf1, udf2, udf3, udf4, udf5, productinfo, udf6, udf7, udf8, udf9, udf10, address1, address2, city, state, country, zipcode);

    const paymentHashKey = sha512.sha512(process.env.MERCHANT_KEY + "|" + transactionID + "|" + amount + "|" + productinfo + "|" + firstname + "|" + email +
        "|" + udf1 + "|" + udf2 + "|" + udf3 + "|" + udf4 + "|" + udf5 + "|" + udf6 + "|" + udf7 + "|" + udf8 + "|" + udf9 + "|" + udf10 + "|" + process.env.EASEBUZZ_SALT + "|" + process.env.MERCHANT_KEY);

    db.query(`INSERT INTO payment_order_details (user_id, package_id_list, transaction_id, amount, email, first_name, udf1, udf2, udf3, udf4, udf5, udf6, udf7, udf8, udf9, udf10, address1, address2, city, state, country, zipcode, payment_hash_key, status, payment_date, created_date, updated_date) VALUES (${userId}, '${productinfo}', '${transactionID}', '${amount}', '${email}', '${firstname}', '${udf1}', '${udf2}', '${udf3}', '${udf4}', '${udf5}', '${udf6}', '${udf7}', '${udf8}', '${udf9}', '${udf10}', '${address1}', '${address2}', '${city}', '${state}', '${country}', '${zipcode}', '${paymentHashKey}', 0, now(), now(), now())`, (errorPaymentOrder, resultsPaymentOrder) => {

        if (errorPaymentOrder) {
            console.log('errorPaymentOrder', errorPaymentOrder);
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

// exports.confirmPaymentStatus = async function (req, res, next) {

//     const transactionID = crypto.randomBytes(16).toString("hex");
//     console.log('transactionID', transactionID);
//     const { userId, transactionID } = req.body;
//     console.log('req.body', req.body, userId, amount, email, phone, firstname, udf1, udf2, udf3, udf4, udf5, productinfo, udf6, udf7, udf8, udf9, udf10, address1, address2, city, state, country, zipcode);

//     const paymentHashKey = sha512.sha512(process.env.MERCHANT_KEY + "|" + transactionID + "|" + amount + "|" + productinfo + "|" + firstname + "|" + email +
//         "|" + udf1 + "|" + udf2 + "|" + udf3 + "|" + udf4 + "|" + udf5 + "|" + udf6 + "|" + udf7 + "|" + udf8 + "|" + udf9 + "|" + udf10 + "|" + process.env.EASEBUZZ_SALT);

//     db.query(`INSERT INTO payment_order_details (user_id, package_id_list, transaction_id, amount, email, first_name, udf1, udf2, udf3, udf4, udf5, udf6, udf7, udf8, udf9, udf10, address1, address2, city, state, country, zipcode, payment_hash_key, status, payment_date, created_date, updated_date) VALUES (${userId}, '${productinfo}', '${transactionID}', '${amount}', '${email}', '${firstname}', '${udf1}', '${udf2}', '${udf3}', '${udf4}', '${udf5}', '${udf6}', '${udf7}', '${udf8}', '${udf9}', '${udf10}', '${address1}', '${address2}', '${city}', '${state}', '${country}', '${zipcode}', '${paymentHashKey}', 0, now(), now(), now())`, (errorPaymentOrder, resultsPaymentOrder) => {

//         if (errorPaymentOrder) {
//             console.log('errorPaymentOrder', errorPaymentOrder);
//             return next(errorPaymentOrder);

//         }

//         if (resultsPaymentOrder && resultsPaymentOrder.insertId) {

//             let packageIds = productinfo.trim().split(/\s*,\s*/);

//             for (let i = 0; i < packageIds.length; i++) {

//                 db.query(`UPDATE package_purchase SET transaction_id = '${transactionID}' where id_package_purchase = ${packageIds[i]}`, async (errorPackageUpdate, resultsPackageUpdate) => {

//                     if (errorPackageUpdate) {

//                         return next(errorPackageUpdate);

//                     }

//                 })
//             }

//             return res.status(200).json({ "message": 'Payment order created successfully', "result": { userId: userId, productInfo: productinfo, orderId: resultsPaymentOrder.insertId, transactionID: transactionID, paymentHashKey: paymentHashKey, merchantKey: process.env.MERCHANT_KEY, salt: process.env.EASEBUZZ_SALT, transactionStatus: 0, furl: process.env.FURL, surl: process.env.SURL } });

//         }

//     });

// }
