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
                result: results,
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
      if (error) return next(error);

      if (results.length > 0) {
        const comparison = await bcrypt.compare(password, results[0].password);

        const accessToken = jwt.sign(
          { username: username, password: password },
          environment.JWT_SECRET
        );

        if (comparison) {
          return res.status(200).json({
            message: "Login successfully",
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

  let page = parseInt(req.query.page, 10) || 1;

  db.query(
    `SELECT count(*) as numRows FROM users`,
    async (error, results, fields) => {

      if (error) return next(error);

      db.query(
        `SELECT * FROM users ORDER BY id_user ASC LIMIT ${numPerPage} OFFSET ${(page-1) * numPerPage}`,
        async (error, result, fields) => {
          var responsePayload = {
            message: "User list fetched successfully.",
            results: result,
          };

          if (error) return next(error);

          if (page > 0) {
            responsePayload.pagination = {
              current: page,
              perPage: numPerPage,
              totalDocs: results[0].numRows,
              totalPages: Math.ceil(results[0].numRows / numPerPage),
              previous: page > 0 ? page - 1 : undefined,
              next: page < Math.ceil(results[0].numRows / numPerPage) ? page + 1 : undefined,
            };
          }  
          res.json(responsePayload);
        }
      );
    }
  );
};

exports.userKycApproval = function (req, res, next) {

  const userId = req.params.id;

  db.query(
    `UPDATE users SET kyc_completed = 1 where id_user = '${userId}'`,
    async (error, results, fields) => {

      if (error) return next(error);

      if (results) {

        return res.status(200).json({
          message: "User kyc updated successfully",
        });
        
      }
    }
  );
};

exports.distributorKycApproval = function (req, res, next) {

  const userId = req.params.id;

  db.query(
    `UPDATE referral_code SET kyc_completed = 1 where user_id = '${userId}'`,
    async (error, results, fields) => {

      if (error) return next(error);

      if (results) {

        return res.status(200).json({
          message: "Distributor kyc updated successfully",
        });

      }
    }
  );
};

exports.deleteUser = function (req, res, next) {

  const userId = req.query.userId;

  db.query(
    `UPDATE users SET approve_user = 0 where id_user = '${userId}'`,
    async (error, results, fields) => {

      if (error) return next(error);

      if (results) {

        return res.status(200).json({
          message: "User deleted successfully",
        });

      }
    }
  );
};

exports.getAllDistributors = async (req, res, next) =>{

  let numPerPage = parseInt(req.query.limit) || 1;

  let page = parseInt(req.query.page) || 1;

  db.query(
    `SELECT count(*) as numRows FROM referral_code`,
    async (error, results, fields) => {

      if (error) return next(error);

      db.query(
        `SELECT users.id_user, users.first_name, users.middle_name, users.last_name, users.email, users.phone_number, users.gender, users.date_of_birth, users.photo, users.aadhaar_card, users.pan_card, users.approve_user, users.aadhaar_front, users.aadhaar_back, users.pancard_photo, users.created_date, users.updated_date, referral_code.id_referral_code, referral_code.kyc_completed, referral_code.code FROM users INNER JOIN referral_code ON users.id_user = referral_code.user_id ORDER BY id_user ASC LIMIT ${numPerPage} OFFSET ${(page-1) * numPerPage}`,
        async (error, result, fields) => {

          const promise3 = new Promise((resolve, reject) => {

            for (let index = 0; index < result.length; index++) {

              const element = result[index];

              if(index == 0){

                db.query(`SELECT * FROM users_tree WHERE referral_user_id = ${element.id_user}`,async (error, data, fields) => {

                  element.childCount = data.length;

                  if(index == result.length - 1){

                    resolve();

                  }

                });
              }
            }
          });

          await promise3;
         
          var responsePayload = {
            message: "Distributors list fetched successfully.",
            results: result,
          };

          if (error) return next(error);

          if (page) {

            responsePayload.pagination = {
              current: page,
              perPage: numPerPage,
              totalDocs: results[0].numRows,
              totalPages: Math.ceil(results[0].numRows / numPerPage),
              previous: page > 0 ? page - 1 : undefined,
              next: page < Math.ceil(results[0].numRows / numPerPage) ? page + 1 : undefined,
            };

          } 

          res.json(responsePayload);
        }
      );
    }
  );
};

exports.getAllUsersByKyc = function (req, res, next) {

  let numPerPage = parseInt(req.query.limit, 10) || 1;

  let page = parseInt(req.query.page, 10) || 1;

  db.query(
    `SELECT count(*) as numRows FROM users WHERE kyc_completed = ${req.params.kycCompleted}`,
    async (error, results, fields) => {

      if (error) return next(error);

      db.query(
        `SELECT * FROM users WHERE kyc_completed = ${req.params.kycCompleted} ORDER BY id_user ASC LIMIT ${numPerPage} OFFSET ${(page-1) * numPerPage}`,
        async (error, result, fields) => {
          var responsePayload = {
            message: "User list fetched successfully.",
            results: result,
          };

          if (error) return next(error);

          if (page > 0) {
            responsePayload.pagination = {
              current: page,
              perPage: numPerPage,
              totalDocs: results[0].numRows,
              totalPages: Math.ceil(results[0].numRows / numPerPage),
              previous: page > 0 ? page - 1 : undefined,
              next: page < Math.ceil(results[0].numRows / numPerPage) ? page + 1 : undefined,
            };
          }  
          res.json(responsePayload);
        }
      );
    }
  );
};

exports.getAllDistributorsByKyc = function (req, res, next) {

  let numPerPage = parseInt(req.query.limit, 10) || 10;

  let page = parseInt(req.query.page, 10) || 1;

  db.query(
    `SELECT count(*) as numRows FROM referral_code WHERE kyc_completed = ${req.params.kycCompleted} `,
    async (error, results, fields) => {

      if (error) return next(error);

      db.query(
        `SELECT users.id_user, users.first_name, users.middle_name, users.last_name, users.email, users.phone_number, users.gender, users.date_of_birth, users.photo, users.aadhaar_card, users.pan_card, users.approve_user, users.aadhaar_front, users.aadhaar_back, users.pancard_photo, users.created_date, users.updated_date, referral_code.id_referral_code, referral_code.kyc_completed FROM users JOIN referral_code ON users.id_user = referral_code.user_id WHERE referral_code.kyc_completed = ${req.params.kycCompleted} ORDER BY id_user ASC LIMIT ${numPerPage} OFFSET ${(page-1) * numPerPage}`,
        async (error, result, fields) => {
          console.log("results results=>",error)

          var responsePayload = {
            message: "Distributors list fetched successfully.",
            results: result,
          };

          if (error) return next(error);

          if (page) {

            responsePayload.pagination = {
              current: page,
              perPage: numPerPage,
              totalDocs: results[0].numRows,
              totalPages: Math.ceil(results[0].numRows / numPerPage),
              previous: page > 0 ? page - 1 : undefined,
              next: page < Math.ceil(results[0].numRows / numPerPage) ? page + 1 : undefined,
            };

          } 

          res.json(responsePayload);
        }
      );
    }
  );
};

exports.getDistributorTreeById = function (req, res, next) {

  const userId = req.params.id;

  db.query(
    `SELECT users.id_user, users.first_name, users.middle_name, users.last_name, users.email, users.phone_number, users.gender, users.date_of_birth, users.photo, users.aadhaar_card, users.pan_card, users.kyc_completed, users.approve_user, users.aadhaar_front, users.aadhaar_back, users.pancard_photo, users.created_date, users.updated_date, users_tree.id_users_tree, users_tree.user_id FROM users JOIN users_tree ON users.id_user = users_tree.user_id WHERE users_tree.referral_user_id = ${userId}`,
    async (error, results, fields) => {

      if (error) return next(error);

      if (results.length > 0) {

        const promise3 = new Promise((resolve, reject) => {

          for (let index = 0; index < results.length; index++) {

            const element = results[index];

            db.query(
              `SELECT * FROM users_tree WHERE referral_user_id = ${element.id_user}`,async (error, data, fields) => {

                element.childCount = data.length;

                if(index == results.length - 1){

                  resolve();

                }
                
              });
          }
        });
        
        await promise3;

        return res.status(200).json({
          message: "User tree fetched successfully",
          result: results,
        });

      } else {

        return res.status(200).json({ message: "User tree not found." });
        
      }
    }
  );
};