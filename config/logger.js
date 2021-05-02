log4js = require('log4js');
log4js.configure({
 appenders: { everything: { type: 'file', filename: 'logs/edutech.log' , pattern: '.yyyy-MM-dd-hh', compress: false} },
 categories: { default: { appenders: ['everything'], level: 'debug' } }
});
module.exports = log4js.getLogger('debug');