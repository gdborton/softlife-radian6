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

var app = express();

var fuelux = require('fuel').configure({
    authUrl: 'https://auth.exacttargetapis.com/v1/requestToken',
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET
});

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

/**
THIS IS A WORKAROUND FOR A KNOWN BUG, DO NOT USE THIS CODE IN PRODUCTION
**/
function workaround( req, res, next ) {
	if( 'POST' !== req.method ) {
		next();
	}

	if( '/login' === req.url || '/fireEvent/helloWorld' === req.url ) {
		next();
	}
	
	if( 
		'/ixn/activities/hello-world/save/'		=== req.url ||
		'/ixn/activities/hello-world/execute/'	=== req.url ||
		'/ixn/activities/hello-world/publish/'	=== req.url ||
		'/ixn/activities/hello-world/validate/' === req.url
	){
		var buf = '';
		req.on('data', function(chunk){
			buf += chunk;
		});

		req.on('end', function(){
			try{
				var faultyJSON = /"", *}/;
				// Cleanup Jira: JB-5249
				if( buf.match( faultyJSON ) ) {
					req.body = buf.replace( faultyJSON, '""}' );
				}
				next();
			} catch( err ){
				console.error( 'ERROR: ', err );
				next( err );
			}
			next();
		});
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
app.use(workaround);
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
app.post('/ixn/activities/hello-world/save/', activity.save );
app.post('/ixn/activities/hello-world/validate/', activity.validate );
app.post('/ixn/activities/hello-world/publish/', activity.publish );
app.post('/ixn/activities/hello-world/execute/', activity.execute );

// Custom Hello World Trigger Route
app.post('/ixn/triggers/twitter-handle/', trigger.edit );

// Abstract Event Handler
app.post('/fireEvent/:type', function( req, res ) {
    res.header("Access-Control-Allow-Origin", "*");
    var data = req.body;
    var triggerIdFromAppExtensionInAppCenter = 'softlife-twitter-trigger';
    var JB_EVENT_API = 'https://www.exacttargetapis.com/interaction-experimental/v1/events';
    var reqOpts = {};

    if( 'helloWorld' !== req.params.type ) {
        res.send( 400, 'Unknown route param: "' + req.params.type +'"' );
    } else {
        var tempOpts = {
            url: JB_EVENT_API,
            method: 'POST',
            body: JSON.stringify({
                ContactKey: data.alternativeEmail,
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
    }
});

app.post('/createTweet', function (req, res) {
    console.log('Entering create tweet.');

    res.send( 200, {data: {test: 'text'}} );

    /*var radian6Host = 'https://api.radian6.com';
    var path = '/socialcloud/v1/twitter/status?async=true';
    var requestOptions = {
        url: radian6Host + path,
        headers: {
            'auth_appkey': 'radian6-integration',
            'auth_token': '0a0c0201030887702d7344d5eeda3bff5a1a1e86844c9ac2c418db92b996dabaad221de16c739914322db675ec53c530c326b08b884e',
            'X-R6-SMMAccountId': '42802',
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        method: 'POST',
        body: {
            status: 'This+is+a+test'
        }
    };

    console.log('final url', requestOptions.url);

    req.pipe(request(requestOptions, function (error, innerResponse, body) {
        console.log('error -', error);
        console.log('response -', innerResponse);
        console.log('body -', body);
    })).pipe(res);
    */
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
