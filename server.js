const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');
var path = require('path');
// const mongoose = require('mongoose');
const logger = require('./config/logger');
const usersRoutes = require('./routers/users.route');
const photoRoutes = require('./routers/photo.route');
const packageRoutes = require('./routers/package.route');
const bankRoutes = require('./routers/bank.route');
const paymentRoutes = require('./routers/payment.route');
var sha512 = require('js-sha512');
const environment = process.env;



// const hostDetailsRoutes = require('./routers/hostDetails.route');
// const propertyListRoutes = require('./routers/propertyList.route');
// const amenitiesRoutes = require('./routers/amenities.route');
// const locationRoutes = require('./routers/location.route');
// const userDetailsRoutes = require('./routers/userDetails.route');

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(express.static(path.join(__dirname, '/dist')));


var db = require('./config/database');

// Connect to mongo database    
// var devDbUrl = 'mongodb://localhost/space_bid_db';
// var mongoDB = process.env.MONGODB_URI || devDbUrl;
// mongoose.connect(mongoDB, { useNewUrlParser: true , useUnifiedTopology: true});
// mongoose.Promise = global.Promise;
if (db.state === 'authenticated') {

    console.log({ status: 'connected', message: 'mysql server up' });

} else {

    console.error({ status: 'connected', message: 'mysql server up' });

}


//   });

app.use(bodyParser.json({ type: 'application/json' }));
app.use(bodyParser.urlencoded({ extended: true })); // Middleware
app.use(express.json());
app.use(cors());


app.use('/user', usersRoutes);
app.use('/photo', photoRoutes);
app.use('/package', packageRoutes);
app.use('/bank', bankRoutes);
app.use('/payment', paymentRoutes);



app.post('/paymentResponse', function (req, res) {
    function checkReverseHash(response) {
      var hashstring = process.env.EASEBUZZ_SALT + "|" + response.status + "|" + response.udf10 + "|" + response.udf9 + "|" + response.udf8 + "|" + response.udf7 +
        "|" + response.udf6 + "|" + response.udf5 + "|" + response.udf4 + "|" + response.udf3 + "|" + response.udf2 + "|" + response.udf1 + "|" +
        response.email + "|" + response.firstname + "|" + response.productinfo + "|" + response.amount + "|" + response.txnid + "|" + response.key
      hash_key = sha512.sha512(hashstring);
      if (hash_key == req.body.hash)
        return true;
      else
        return false;
    }
    if (checkReverseHash(req.body)) {
      res.send(req.body);
    }
    res.send('false, check the hash value ');
  });

// app.use('/host', hostDetailsRoutes);
// app.use('/property', propertyListRoutes);
// app.use('/amenities', amenitiesRoutes);
// app.use('/location', locationRoutes);
// app.use('/user', userDetailsRoutes);

app.get("*", function (req, res) {
    logger.info("users route");
    res.sendFile(HTML_FILE);
})

app.use(function (err, req, res, next) {
    logger.error(err.stack)
    // res.json({ message: err.message });
})
const port = process.env.PORT || 8091
app.listen(port, () => {
    console.log("port  : : ", port)
    logger.log('Server is up and running on port number ' + port);
});

module.exports = { app };