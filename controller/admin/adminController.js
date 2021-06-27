const { validationResult } = require("express-validator");
var logger = require("../../config/logger");
const dotenv = require("dotenv");
let result = dotenv.config();
const jwt = require("jsonwebtoken");
const axios = require("axios");
const bcrypt = require("bcrypt");
const saltRounds = 10;
if (result.error) {
  throw result.error;
}
const { parsed: env } = result;
const environment = process.env;
var db = require("../../config/database");

exports.addAdminUser = async function (req, res, next) {
    
  console.log("request body", req.body);

  const {
    salutation,
    firstName,
    middleName,
    lastName,
    email,
    password,
    phoneNumber,
    gender,
    dateOfBirth,
    photo,
  } = req.body;

  const encryptedPassword = await bcrypt.hash(password, saltRounds);

  db.query(
    `SELECT * from admins where email = '${email}'`,
    (errorUser, resultsUser, fields) => {
      if (errorUser) {
        return next(errorUser);
      }

      if (resultsUser[0]) {
        return res.status(409).json({ message: "Email id already exists" });
      } else {
        db.query(
          `INSERT INTO admins (salutation, first_name, middle_name, last_name, email, password, phone_number, gender, date_of_birth, photo, created_date, updated_date) VALUES ('${salutation}', '${firstName}', '${middleName}', '${lastName}', '${email}', '${encryptedPassword}', '${phoneNumber}', '${gender}', '${dateOfBirth}', '${photo}', now(), now())`,
          (error, results) => {
            if (error) {
              return next(error);
            }

            if (results) {
              return res.status(200).json({
                message: "User added successfully",
                result: results
              });
            }
          }
        );
      }
    }
  );
};

exports.getAdminLogin = function (req, res, next) {

  const { username, password } = req.body;

  db.query(
    `SELECT * from admins where email = '${username}'`,
    async (error, results, fields) => {

      if (error) {

        return res.status(200).json({ message: "Error while admin login" });

      }
      if (results.length > 0) {

        const comparison = await bcrypt.compare(password, results[0].password);

        const accessToken = jwt.sign(
          { username: username, password: password },
          environment.JWT_SECRET
        );

        if (comparison) {

          return res.status(200).json({
            message: "Login successfull",
            result: results,
            token: accessToken,
          });

        } else {

          return res.status(401).json({ message: "Password is wrong" });

        }
      } else {

        return res.status(200).json({ message: "Username is wrong" });

      }
    }
  );
};

exports.getAllUsers = function (req, res, next) {

    let numPerPage = parseInt(req.query.limit, 10) || 1;

    let page = parseInt(req.query.page, 10) || 0;

    let numPages;

    let skip = page * numPerPage;

    // Here we compute the LIMIT parameter for MySQL query

    let limit = skip + "," + numPerPage;

    db.query(
      `SELECT count(*) as numRows FROM users`,
      async (error, results, fields) => {

        numPages = Math.ceil(results[0].numRows / numPerPage);
  
        db.query(
          `SELECT * FROM users ORDER BY id_user ASC LIMIT ${limit}`,
          async (error, result, fields) => {
  
            var responsePayload = {
              message: "User list fetched successfully.",
              results: result,
            };
  
            if (page) {
  
              responsePayload.pagination = {
                current: page,
                perPage: numPerPage,
                previous: page > 0 ? page - 1 : undefined,
                next: page < numPages - 1 ? page + 1 : undefined,
              };
  
            } else
              responsePayload.pagination = {
                err:
                  "queried page " +
                  page +
                  " is >= to maximum page number " +
                  numPages,
              };
  
            res.json(responsePayload);
  
          }
        );
      }
    );
};

  exports.getPackageByUserId = function (req, res, next) {
     
    const userId = req.query.userId;
    db.query(
      `SELECT * FROM package_purchase where user_id = '${userId}'`,
      async (error, results, fields) => {

          if(error) return next();

          if(results[0]){
            return res.status(200).json({
                message: "User package fetched successfully",
                result: results
              });
          }

        
      }
    );
  };