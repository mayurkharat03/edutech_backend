const mysql = require('mysql');
const config = require('./config');
const logger = require('./logger')


let url = '';

console.log("process.env.NODE_ENV ::::::::::::", process.env.NODE_ENV);
const MYSQL_USERNAME = config.MYSQL_USERNAME;
const MYSQL_PASSWORD = config.MYSQL_PASSWORD;
const MYSQL_HOSTNAME = config.MYSQL_HOSTNAME;
console.log(MYSQL_HOSTNAME);
const MYSQL_PORT = config.MYSQL_PORT;
const MYSQL_DB = config.MYSQL_DB;

var connection = mysql.createConnection({
    host     : MYSQL_HOSTNAME,
    user     : MYSQL_USERNAME,
    password : '',
    database : MYSQL_DB
});

connection.connect(function(err) {
    if (err) throw err;
});

module.exports = connection;