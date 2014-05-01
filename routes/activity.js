'use strict';

// NOTE: Each route can render a server-side view
// Deps

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
    console.log(req);
    console.log('stringifyBody: ' + JSON.stringify(req.body));

	if (!req.body.tweet) {
		response.send(400, 'The tweet param is required.');
	}else {
		var radian6Host = 'https://api.radian6.com';
		var path = '/socialcloud/v1/twitter/status?async=true';
		var requestOptions = {
			url: radian6Host + path,
			headers: {
				'auth_appkey': 'radian6-integration',
				'auth_token': '0a0c0201030887702d7344d5eeda3bff5a1a1e86844c9ac2c418db92b996dabaad221de16c739914322db675ec53c530c326b08b884e',
				'X-R6-SMMAccountId': '42802',
				'Content-Type': 'application/x-www-form-urlencoded'
			},
			form: {
				status: req.body.tweet
			}
		};

		req.pipe(request.post(requestOptions)).pipe(response);
	}
};

/*
 * POST Handler for /publish/ route of Activity.
 */
exports.publish = function( req, res ) {
    // Data from the req and put it in an array accessible to the main app.
    //console.log( req.body );
   // exports.logExecuteData.push( req );
    res.send( 200, 'Publish' );
};

/*
 * POST Handler for /validate/ route of Activity.
 */
exports.validate = function( req, res ) {
    // Data from the req and put it in an array accessible to the main app.
    //console.log( req.body );
   // exports.logExecuteData.push( req );
    res.send( 200, 'Validate' );
};
