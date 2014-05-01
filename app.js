'use strict';
// Module Dependencies
// -------------------
//require('newrelic');


var express     = require('express');
var http        = require('http');
var JWT         = require('./lib/jwtDecoder');
var path        = require('path');
var request     = require('request');
var routes      = require('./routes');
var activity    = require('./routes/activity');
var trigger     = require('./routes/trigger');
var xmltojson   = require('xmljson').to_json;



var app = express();

var fuelux = require('fuel').configure({
    authUrl: 'https://auth.exacttargetapis.com/v1/requestToken',
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET
});

var Radian6Config = {
	token: process.env.R6_AUTH_TOKEN,
	appKey: process.env.R6_APP_KEY,
	accountId: process.env.R6_ACCOUNT_ID
}

// Register configs for the environments where the app functions
// , these can be stored in a separate file using a module like config
var APIKeys = {
    appId           : process.env.APP_ID,
    clientId        : process.env.CLIENT_ID,
    clientSecret    : process.env.CLIENT_SECRET,
    appSignature    : process.env.APP_SIGNATURE,
    authUrl         : 'https://auth.exacttargetapis.com/v1/requestToken?legacy=1'
};

// Simple custom middleware
function tokenFromJWT( req, res, next ) {
    // Setup the signature for decoding the JWT
    var jwt = new JWT({appSignature: APIKeys.appSignature});
    
    // Object representing the data in the JWT
    var jwtData = jwt.decode( req );

    // Bolt the data we need to make this call onto the session.
    // Since the UI for this app is only used as a management console,
    // we can get away with this. Otherwise, you should use a
    // persistent storage system and manage tokens properly with
    // node-fuel
    req.session.token = jwtData.token;
    app.configure('token', jwtData.token);
    next();
}

// Radian6
function radian6(options, callback) {
	var radian6Host = 'https://api.radian6.com';
	if (!options || !options.path) {
		return callback(new Error('options.path is required'));
	}

	var requestOptions = {
		url: radian6Host + options.path,
		headers: {
			'auth_appkey': Radian6Config.appKey,
			'auth_token': Radian6Config.token,
			'X-R6-SMMAccountId': Radian6Config.accountId
		}
	};

	if (!options.method || options.method === 'GET') {
		request.get(requestOptions, function (error, response, body) {
			if (error) return callback(error);

			xmltojson(body, function (error, data) {
				if (error) return callback(error);

				return callback.apply(null, arguments);

			});
		});
	} else {
		return request(requestOptions, callback);
	}

}


// Use the cookie-based session  middleware
app.use(express.cookieParser());

// TODO: MaxAge for cookie based on token exp?
app.use(express.cookieSession({secret: "HelloWorld-CookieSecret"}));

// Configure Express
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.multipart()); // Added this while testing create tweet
app.use(express.methodOverride());
app.use(express.favicon());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// Express in Development Mode
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

// HubExchange Routes
app.get('/', routes.index );
app.post('/login', tokenFromJWT, routes.login );
app.post('/logout', routes.logout );

// Custom Hello World Activity Routes
app.post('/ixn/activities/tweet/save/', activity.save );
app.post('/ixn/activities/tweet/validate/', activity.validate );
app.post('/ixn/activities/tweet/publish/', activity.publish );
app.post('/ixn/activities/tweet/execute/', activity.execute );

// Custom Hello World Trigger Route
app.post('/ixn/triggers/twitter-handle/', trigger.edit );

// Abstract Event Handler
app.post('/fireEvent/:type', function( req, res ) {
    res.header("Access-Control-Allow-Origin", "*");
    var data = req.body;
    var triggerIdFromAppExtensionInAppCenter = 'softlife-twitter-trigger';
    var JB_EVENT_API = 'https://www.exacttargetapis.com/interaction-experimental/v1/events';
    var reqOpts = {};

	function getTwitterFollowerCount(options, callback) {
		var retries = 10;

        function getJobData(options, callback) {
			// If success, use job id to get the twitter user info
			var reqOptions = {
				path: '/socialcloud/v1/jobs/' + options.jobId
			};

			radian6(reqOptions, function (error, data) {
				if (error) {
					return callback(error);
				} else {
					// Make sure job is 'SENT'
					if (data && data.jobDetails && data.jobDetails.status === 'SENT') {
						return callback.apply(null, arguments);
					} else if (data && data.jobDetails && data.jobDetails.status === 'FAILED') {
						return callback(new Error('Failed to get twitter follower'));
					} else if (retries <= 0) {
						return callback(new Error('No more trying to get twitter follower'));
					}
                    retries = retries - 1;
					setTimeout(getJobData(options, callback), 500);
				}
			});
		}

		// Get the async job
		var requestOptions = {
			path: '/socialcloud/v1/twitter/user/' + options.twitterHandle + '?async=true'
		};

		radian6(requestOptions, function(error, data) {
			if (error) {
				return callback(error);
			} else if (data && data.jobRequest && data.jobRequest.jobId) {

				// If success, use job id to get the twitter user info
				getJobData({jobId: data.jobRequest.jobId}, function(error, data) {
					if (error) {
						return callback(error);
					} else {
						return callback.apply(null, arguments);
					}
				});

			} else {
				return callback(new Error('Could not get async job id'));
			}
		});

	}

    if( 'helloWorld' !== req.params.type ) {
        res.send( 400, 'Unknown route param: "' + req.params.type +'"' );
    } else if (data.twitterHandle){
        // Get follower count and add that to our data
		getTwitterFollowerCount({twitterHandle: data.twitterHandle}, function(error, twitterUserData) {
		console.log("Errorlog: " + error);
			console.log("twitterUserData log: " + JSON.stringify(twitterUserData));
			if (!error && twitterUserData && twitterUserData.jobDetails && twitterUserData.jobDetails.lastResponse && twitterUserData.jobDetails.lastResponse['twitter-user']['$'].followers) {
				data.twitterFollowers = twitterUserData.jobDetails.lastResponse['twitter-user']['$'].followers;

				var tempOpts = {
					url: JB_EVENT_API,
					method: 'POST',
					body: JSON.stringify({
						ContactKey: data.primaryEmailAddress,
						EventDefinitionKey: triggerIdFromAppExtensionInAppCenter,
						Data: data
					})
				};

				fuelux(tempOpts, function( error, response, body ) {
					if( error ) {
						console.error( 'ERROR: ', error );
						res.send( response, 400, error );
					} else {
						res.send( body, 200, response);
					}
				}.bind( this ));
			} else {
				res.send( 400, 'This is the real error' );
			}
		});


    } else {
		res.send( 400, 'Twitter handle required' );
	}
});

app.post('/createTweet', function (req, response) {
    if (!req.body.tweet) {
        response.send(400, 'The tweet param is required.');
    }else {
        var radian6Host = 'https://api.radian6.com';
        var path = '/socialcloud/v1/twitter/status?async=true';
        var requestOptions = {
            url: radian6Host + path,
            headers: {
				'auth_appkey': Radian6Config.appKey,
				'auth_token': Radian6Config.token,
				'X-R6-SMMAccountId': Radian6Config.accountId,
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            form: {
                status: req.body.tweet
            }
        };

        req.pipe(request.post(requestOptions)).pipe(response);
    }
});

// Radian6
app.get('/getTopics', function( req, res ) {
	var radian6TopicsUrl = 'https://api.radian6.com/socialcloud/v1/topics/644552';

	var tempOpts = {
		path: '/socialcloud/v1/topics/644552',
		method: 'GET'
	};

	radian6(tempOpts, function(error, data) {
		if( error ) {
			console.error( 'ERROR: ', error );
			res.send( response, 400, error );
		} else {
			console.log(JSON.stringify(data));

			res.send( JSON.stringify(data), 200, res);

		}
	});

});

app.get('/getTwitterUser/:twitterHandle', function( req, res ) {
	function getJobData(options, callback) {
		// If success, use job id to get the twitter user info
		var reqOptions = {
			path: '/socialcloud/v1/jobs/' + options.jobId
		};

		radian6(reqOptions, function (error, data) {
			if (error) {
				return callback(error);
			} else {
				// Make sure job is 'SENT'
				if (data && data.jobDetails && data.jobDetails.status === 'SENT') {
					return callback.apply(null, arguments);
				}
				getJobData(options, callback);
			}
		});
	}

	//TODO: validation on twitter handle
	if (!req.params.twitterHandle) {
		res.send(400, 'The twitter handle is required.');
	}else {
		// Get the async job
		var requestOptions = {
			path: '/socialcloud/v1/twitter/user/' + req.params.twitterHandle + '?async=true'
		};

		radian6(requestOptions, function(error, data) {
			if( error ) {
				res.send( res, 400, error );
			} else if (data && data.jobRequest && data.jobRequest.jobId) {

				// If success, use job id to get the twitter user info
				getJobData({jobId: data.jobRequest.jobId}, function(error, data) {
					if (error) {
						res.send( res, 400, error );
					} else {
						res.send( JSON.stringify(data), 200, res);
						//res.send(data.jobDetails.lastResponse['twitter-user']['$'].followers.toString(), 200, res);
					}
				});

			} else {
				// send fail
				res.send( 400, res );
			}
		});

	}

});

app.get('/clearList', function( req, res ) {
	// The client makes this request to get the data
	activity.logExecuteData = [];
	res.send( 200 );
});


// Used to populate events which have reached the activity in the interaction we created
app.get('/getActivityData', function( req, res ) {
	// The client makes this request to get the data
	if( !activity.logExecuteData.length ) {
		res.send( 200, {data: null} );
	} else {
        res.send( 200, {data: {test: 'text'}} );
		//res.send( 200, {data: activity.logExecuteData} );
	}
});

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
