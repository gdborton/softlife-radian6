'use strict';

var mongodb = require('mongodb');
var	MongoClient = mongodb.MongoClient;

var activities;


var MONGOHQ_URL="mongodb://softlife:hackathon@paulo.mongohq.com:10060/thejoy";

// NOTE: Each route can render a server-side view
// Deps
var request     = require('request');
var xmltojson   = require('xmljson').to_json;

exports.logExecuteData = [];

/*
 * POST Handler for / route of Activity (this is the edit route).
 */
exports.edit = function( req, res ) {
    // Data from the req and put it in an array accessible to the main app.
    //console.log( req.body );
   // exports.logExecuteData.push( req );
    res.send( 200, 'Edit' );
};

/*
 * POST Handler for /save/ route of Activity.
 */
exports.save = function( req, res ) {
    // Data from the req and put it in an array accessible to the main app.
    //console.log( req.body );
    //exports.logExecuteData.push( req );
    res.send( 200, 'Save' );
};

/*
 * POST Handler for /execute/ route of Activity.
 */
exports.execute = function( req, response ) {

    var primaryEmailAddress = req.body.keyValue;

	MongoClient.connect(MONGOHQ_URL, function (err, db) {

		var collection = db.collection('activities');

		collection.find({}).toArray(function (err, docs) {
			if (err) {
				return console.error(err)
			}

            var selectedIndex = Math.round(Math.random() * (docs.length - 0));
            var tweet = docs[selectedIndex].tweetContent;


            retrieveDEData(primaryEmailAddress, function (twitterHandle) {
                tweet = tweet.replace(/{{twitterHandle}}/g, '@' + twitterHandle);

                var radian6Host = 'https://api.radian6.com';
                var path = '/socialcloud/v1/twitter/status?async=true';
                var requestOptions = {
                    url: radian6Host + path,
                    headers: {
                        'auth_appkey': process.env.R6_APP_KEY,
                        'auth_token': process.env.R6_AUTH_TOKEN,
                        'X-R6-SMMAccountId': process.env.R6_ACCOUNT_ID,
                        'Content-Type': 'application/x-www-form-urlencoded'
                    },
                    form: {
                        status: tweet
                    }
                };

                req.pipe(request.post(requestOptions)).pipe(response);
            });
		});
	});

	console.log(req);
    console.log('stringifyBody: ' + JSON.stringify(req.body));
};

/*
 * POST Handler for /publish/ route of Activity.
 */
exports.publish = function( req, res ) {
    res.send( 200, 'Publish' );
};

/*
 * POST Handler for /validate/ route of Activity.
 */
exports.validate = function( req, res ) {
    res.send( 200, 'Validate' );
};


function retrieveDEData (contactKey, callback) {
	var authReqOpt = {
		url: 'https://auth.exacttargetapis.com/v1/requestToken?legacy=1',
		headers: {
			'Content-Type': 'text/json'
		},
		json: true,
		body: {
			clientId: process.env.CLIENT_ID,
			clientSecret: process.env.CLIENT_SECRET
		}
	};

	request.post(authReqOpt, function(error, response, body) {
		if( error ) {
			console.log('error auth');
			callback(error);
		} else {

			var envelope = '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">' +
				'<soapenv:Header>' +
				'<oAuth xmlns="http://exacttarget.com">' +
				'<oAuthToken>' + body.legacyToken + '</oAuthToken>' +
				'</oAuth>' +
				'<wsse:Security soapenv:mustUnderstand="1" xmlns:wsse="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd">' +
				'<wsse:UsernameToken xmlns:wsu="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd">' +
				'<wsse:Username>*</wsse:Username>' +
				'<wsse:Password Type="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-username-token-profile-1.0#PasswordText">*</wsse:Password>' +
				'</wsse:UsernameToken>' +
				'</wsse:Security>' +
				'</soapenv:Header>' +
				'<soapenv:Body>' +
				'<RetrieveRequestMsg xmlns="http://exacttarget.com/wsdl/partnerAPI">' +
				'<RetrieveRequest>' +
				'<ObjectType>DataExtensionObject[softlife twitter trigger]</ObjectType>' + //'<Properties>primaryEmailAddress</Properties>' +
				'<Properties>twitterHandle</Properties>' + //'<Properties>twitterFollowers</Properties>' +
				'<Filter xsi:type="SimpleFilterPart">' +
				'<Property>primaryEmailAddress</Property>' +
				'<SimpleOperator>equals</SimpleOperator>' +
				'<Value>' + contactKey + '</Value>' +
				'</Filter>' +
				'</RetrieveRequest>' +
				'</RetrieveRequestMsg>' +
				'</soapenv:Body>' +
				'</soapenv:Envelope>';

			var requestOptions = {
				url: 'https://webservice.exacttarget.com/Service.asmx',
				headers: {
					'Content-Type': 'text/xml;charset=UTF-8',
					'SOAPAction': 'Retrieve'
				},
				body: envelope
			};

			request.post(requestOptions, function(error, response, body) {
				if( error ) {
					callback(error);
				} else {

					xmltojson(body, function (error, data) {
						if (data && data["soap:Envelope"]["soap:Body"].RetrieveResponseMsg && data["soap:Envelope"]["soap:Body"].RetrieveResponseMsg.Results && data["soap:Envelope"]["soap:Body"].RetrieveResponseMsg.Results.Properties && data["soap:Envelope"]["soap:Body"].RetrieveResponseMsg.Results.Properties.Property.Value) {
							callback(data["soap:Envelope"]["soap:Body"].RetrieveResponseMsg.Results.Properties.Property.Value);
						} else if (data && data["soap:Envelope"]["soap:Body"].RetrieveResponseMsg && data["soap:Envelope"]["soap:Body"].RetrieveResponseMsg.Results && data["soap:Envelope"]["soap:Body"].RetrieveResponseMsg.Results["0"] && data["soap:Envelope"]["soap:Body"].RetrieveResponseMsg.Results["0"].Properties && data["soap:Envelope"]["soap:Body"].RetrieveResponseMsg.Results["0"].Properties.Property.Value) {
                            callback(data["soap:Envelope"]["soap:Body"].RetrieveResponseMsg.Results["0"].Properties.Property.Value);
						} else {
							callback(data);
						}
					});
				}
			});
		}
	});
};
