const logger = require('./logger');
//Read enviornment variables
console.log("Config loading ::::::::::::", process.env.NODE_ENV);

const dotenv = require('dotenv');
let result = dotenv.config();

if (result.error) {
    throw result.error;
}

const { parsed: env } = result;
let environment = process.env;
logger.log("HOSTNAME+++++++++++", environment.MYSQL_HOSTNAME)
console.log("HOSTNAME====", environment.MYSQL_HOSTNAME);
console.log("MYSQL_DB:", environment.MYSQL_DB);
console.log("MYSQL_USERNAME:", environment.MYSQL_USERNAME);
console.log("MYSQL_PASSWORD:", environment.MYSQL_PASSWORD);
console.log("MYSQL_HOSTNAME:", environment.MYSQL_HOSTNAME);
console.log("MYSQL_PORT:", environment.MYSQL_PORT);
console.log("MYSQLDB_URI:", environment.MYSQLDB_URI);
//Application PORT
console.log(" PORT:", environment.PORT);
console.log("JWT_SECRET:", environment.JWT_SECRET);
console.log("COMMUNICATION_APP_LOCAL:", environment.COMMUNICATION_APP_LOCAL);

module.exports = {
    //MYSQL database setup
    MYSQL_DB: environment.MYSQL_DB,
    MYSQL_USERNAME: environment.MYSQL_USERNAME,
    MYSQL_PASSWORD: environment.MYSQL_PASSWORD,
    MYSQL_HOSTNAME: environment.MYSQL_HOSTNAME,
    MYSQL_PORT: environment.MYSQL_PORT,
    MYSQLDB_URI: environment.MYSQLDB_URI,
    //Application PORT
    PORT: environment.PORT,
    JWT_SECRET: environment.JWT_SECRET,
    COMMUNICATION_APP_LOCAL: environment.COMMUNICATION_APP_LOCAL
};



