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


exports.addPackage = async function (req, res, next) {


    const purchaseDate = getDateFormat(new Date());
    const expiryDate = getDateFormat(addOneYearToDate(new Date()));

    console.log(purchaseDate, expiryDate);
    const { boardId, standardId, userId, standardPackageListIDs, totalPrice } = req.body;


    db.query(`INSERT INTO package_purchase (board_id, standard_id, standard_package_ids, user_id, total_price, purchase_date, expiry_date, status, created_date, updated_date) VALUES (${boardId}, ${standardId}, '${standardPackageListIDs}', ${userId}, '${totalPrice}', '${purchaseDate}', '${expiryDate}', 0, now(), now())`, (error, results) => {

        // console.log('request', error);

        if (error) {

            return next(error);

        }

        if (results && results.insertId) {

            return res.status(200).json({ "message": 'Package added successfully', "result": results });

        }

    });

}


exports.deletePackage = async function (req, res, next) {

    console.log('request', req.params.purchasePackageId);

    const purchasePackageId = req.params.purchasePackageId


    db.query(`DELETE FROM package_purchase where id_package_purchase = ${purchasePackageId}`, (error, results) => {

        console.log('error', error, 'result', result);
        if (error) {

            return next(error);

        }

        if (results) {

            return res.status(200).json({ "message": 'Package deleted successfully', "result": results });

        }

    });

}

exports.getBoards = function (req, res, next) {

    db.query(`SELECT * from boards`, async (error, results, fields) => {

        if (error) {

            return next(error);

        }

        if (results.length > 0) {

            return res.status(200).json({ "message": 'Boards List', "result": results });

        }

    });

}


exports.getStandardsByBoardId = function (req, res, next) {

    const boardId = req.params.boardId;

    db.query(`SELECT * from standards where board_id = ${boardId} ORDER BY LENGTH(standard_name), standard_name`, async (error, results, fields) => {

        if (error) {

            return next(error);

        }

        if (results.length > 0) {

            return res.status(200).json({ "message": 'Standard List by Boards', "result": results });

        }

    });

}


exports.addStudent = async function (req, res, next) {

    console.log('request', req.body);

    const { salutation, firstName, middleName, lastName, gender, schoolName, dateOfBirth, packageId, userId } = req.body;


    db.query(`INSERT INTO student_details (salutation, first_name, middle_name, last_name, gender, school_name, date_of_birth, package_id, user_id, created_date, updated_date) VALUES ('${salutation}', '${firstName}', '${middleName}', '${lastName}', ${gender}, '${schoolName}', '${dateOfBirth}', ${packageId}, ${userId}, now(), now())`, (error, results) => {

        if (error) {

            return next(error);

        }

        if (results && results.insertId) {

            return res.status(200).json({ "message": 'Student added successfully', "result": results });

        }

    });

}


exports.getPackageByUserId = async function (req, res, next) {

    const userId = req.params.userId;

    let queryResults;
    let studentDetails;

    db.query(`SELECT * from package_purchase where user_id = ${userId}`, async (error, results, fields) => {

        if (error) {

            return next(error);

        }

        if (results.length > 0) {
            queryResults = results;

            const promises = results.map((item, index) => {

                db.query(`SELECT * from standards where id_standards = ${item.standard_id}`, async (errorStd, resultsStd, fieldsStd) => {

                    if (errorStd) {

                        return next(errorStd);

                    }

                    db.query(`SELECT * from student_details where package_id = ${item.id_package_purchase}`, (errorStdu, resultsStdu, fieldsStdu) => {

                        if (errorStdu) {

                            return next(errorStdu);

                        }

                        if (resultsStdu.length > 0) {
                            queryResults[index].studentDetails = resultsStdu[0];
                        } else {
                            queryResults[index].studentDetails = {};
                        }

                        queryResults[index].subjectDetails = resultsStd[0];

                        if ((results.length - 1) == index) {

                            return res.status(200).json({ "message": 'Purchase Package by User', "result": queryResults });

                        }

                    })

                })

            })

        } else {

            return res.status(200).json({ "message": 'Purchase Package by User', "result": queryResults });

        }

    });

}


function getDateFormat(dateValue) {

    dateValue = new Date(dateValue.getTime() - 3000000);
    let date_format_str = dateValue.getFullYear().toString() + "-" + ((dateValue.getMonth() + 1).toString().length == 2 ? (dateValue.getMonth() + 1).toString() : "0" + (dateValue.getMonth() + 1).toString()) + "-" + (dateValue.getDate().toString().length == 2 ? dateValue.getDate().toString() : "0" + dateValue.getDate().toString()) + " " + (dateValue.getHours().toString().length == 2 ? dateValue.getHours().toString() : "0" + dateValue.getHours().toString()) + ":" + ((parseInt(dateValue.getMinutes() / 5) * 5).toString().length == 2 ? (parseInt(dateValue.getMinutes() / 5) * 5).toString() : "0" + (parseInt(dateValue.getMinutes() / 5) * 5).toString()) + ":00";
    return date_format_str;

}

function addOneYearToDate(dateValue) {

    let year = dateValue.getFullYear();
    let month = dateValue.getMonth();
    let day = dateValue.getDate();
    return new Date(year + 1, month, day);

}
