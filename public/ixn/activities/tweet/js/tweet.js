define( function( require ) {
    var Postmonger = require( 'postmonger' );
    require( 'jquery.min' );
    require( 'underscore' );


    var connection = new Postmonger.Session();
	var tokens;
	var endpoints;

    $(window).ready(function() {
        connection.trigger('ready');
		//connection.trigger('requestTokens');
		//connection.trigger('requestEndpoints');
    })

	// This listens for Journey Builder to send tokens
	// Parameter is either the tokens data or an object with an
	// "error" property containing the error message
	connection.on('getTokens', function( data ) {
		if( data.error ) {
			console.error( data.error );
		} else {
			tokens = data;
		}
	});

	// This listens for Journey Builder to send endpoints
	// Parameter is either the endpoints data or an object with an
	// "error" property containing the error message
	connection.on('getEndpoints', function( data ) {
		if( data.error ) {
			console.error( data.error );
		} else {
			endpoints = data;
		}
	});

    connection.on('requestPayload', function() {
	 var payload = {};

        payload.options = {
           
        };

		//TODO: Shouldn't this come from the data?
        payload.flowDisplayName = "Send Tweet";
	    payload.tweetContent = $('#txtTweet').val();

	    $.ajax({
		    url:"https://api.mongohq.com/databases/thejoy/collections/activities/documents?_apikey=RHOyGeUiMIxBxMXSOtfyJ6FKaUQD9wfVmYFCJ3ehi4",
		    type:"POST",
		    dataType:"json",
		    data: {"document":payload},
		    success: function(d){
				console.log('success '+ JSON.stringify(d));
			    connection.trigger('getPayload', payload);
		    },
		    error: function(){
			    console.log('error');
		    }
	    });
    });

	// Journey Builder broadcasts this event to us after this module
	// sends the "ready" method. JB parses the serialized object which
	// consists of the Event Data and passes it to the
	// "config.js.save.uri" as a POST
    connection.on('populateFields', function(payload) {
	    //mongodb://softlife:hackathon@oceanic.mongohq.com:10019/softlife
	    $.ajax({
		    url:"https://api.mongohq.com/databases/thejoy/collections/acivities/documents?_apikey=RHOyGeUiMIxBxMXSOtfyJ6FKaUQD9wfVmYFCJ3ehi4",
		    dataType:"json",
		    type:"GET",
		    success: function(data){
				console.log(JSON.stringify(data));
			    var row="";
			    for(var i=0;i<data.length;i++) {
				    row += "<tr><td>" +data[i].tweetContent + "<td></tr>";
			    }

			    var table = "<table>"+ row +"</table>";
			    $('#dvTweets').html(table);

		    },
		    error: function(){

		    }
	    });

//	    payload.flowDisplayName = "Send Tweet";
//	    payload.tweetContent = "Congratulation you won a personal JetPack"


    });

	// Trigger this method when updating a step. This allows JB to
	// update the wizard.
    //connection.trigger('updateStep', nextStep);

	// When everything has been configured for this activity, trigger
	// the save:
	// connection.trigger('save', 
});
