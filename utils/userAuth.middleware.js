let jwt = require('jsonwebtoken');
const config = require('../config/config');
const logger = require('../config/logger');

const checkToken = function (req, res, next) {
    let token = req.headers['x-access-token'] || req.headers['authorization'] || req.query.token; // Express headers are auto converted to lowercase
    if (token !== undefined && token.startsWith('Bearer ')) {
        // Remove Bearer from string
        token = token.slice(7, token.length);
    } else {
        return res.status(401).json({ message: "Token is not valid" });
    }
    let payload;
    try {
        payload = jwt.verify(token, config.JWT_SECRET);
        req.payload = payload;
        // console.log(payload);
        // module.exports={payload}
        next();
    } catch (e) {
        logger.error("Error:::::::::::", e);
        if (e instanceof jwt.JsonWebTokenError) {
            // if the error thrown is because the JWT is unauthorized, return a 401 error
            return res.status(401).json({ message: "Token is not valid" });
        }
        // otherwise, return a bad request error
        return res.status(400).end();
    }
};

module.exports = {
    checkToken: checkToken
}

