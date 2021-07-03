let curl_call = function (url, data, method = 'POST') {
  console.log('url, data, method', url, data, method);
  var request = require('request');
  var options = {
    'method': method,
    'url': url,
    'headers': {
      'Content-Type': 'application/x-www-form-urlencoded'
    },

    form: data,
  };
  return new Promise(function (resolve, reject) {
    request(options, function (error, response) {
      if (response) {
        var data = JSON.parse(response.body)
        return resolve(data);
      } else
        return reject(error);
    })
  })
}

let generateHash = function (data, config) {

  var hashstring = config.key + "|" + data.txnid + "|" + data.amount + "|" + data.productinfo + "|" + data.name + "|" + data.email +
    "|" + data.udf1 + "|" + data.udf2 + "|" + data.udf3 + "|" + data.udf4 + "|" + data.udf5 + "|" + data.udf6 + "|" + data.udf7 + "|" + data.udf8 + "|" + data.udf9 + "|" + data.udf10;
  hashstring += "|" + config.salt;
  data.hash = sha512.sha512(hashstring);
  return (data.hash);
}


exports.generateHash = generateHash;
exports.call = curl_call;