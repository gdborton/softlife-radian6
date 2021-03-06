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
	       tweetContent : $('#txtTweet').val()
//	       tweetContent2 : $('#txtTweet2').val(),
//	       tweetContent3 : $('#txtTweet3').val()
        };

		//TODO: Shouldn't this come from the data?
        payload.flowDisplayName = "Send Tweet";
	    payload.tweetContent = $('#txtTweet').val();
	    //connection.trigger('getPayload', payload);
		if($.trim($('#txtTweet').val())) {
			$.ajax({
				url: "https://api.mongohq.com/databases/thejoy/collections/activities/documents?_apikey=RHOyGeUiMIxBxMXSOtfyJ6FKaUQD9wfVmYFCJ3ehi4",
				type: "POST",
				dataType: "json",
				data: {"document": payload},
				success: function (d) {

					connection.trigger('getPayload', payload);
				},
				error: function () {
					console.log('error');
				}
			});
		} else {
			connection.trigger('getPayload', payload);
		}
    });

	// Journey Builder broadcasts this event to us after this module
	// sends the "ready" method. JB parses the serialized object which
	// consists of the Event Data and passes it to the
	// "config.js.save.uri" as a POST
    connection.on('populateFields', function(options) {

	    $.ajax({
		    url:"https://api.mongohq.com/databases/thejoy/collections/activities/documents?_apikey=RHOyGeUiMIxBxMXSOtfyJ6FKaUQD9wfVmYFCJ3ehi4&limit=100",
		    dataType:"json",
		    type:"GET",
		    success: function(data){
				console.log(JSON.stringify(data));
			    var row="";
			    for(var i=0;i<data.length;i++) {
				    row += '<tr><td>' +data[i].tweetContent + '</td><td><button class="close" data-id="'+data[i]._id.$oid+'">&times;</button></td></tr>';
			    }

			    var table = '<table class="table table-bordered table-striped" style="width:494px;"><thead><tr><th>Tweet Content</th><th>Delete</th></tr></thead><tbody>'+ row +'</tbody></table>';
			    $('#dvTweets').html(table);
				$('.close').on('click', function(e){
					var self = $(this);
					e.preventDefault();
				    var id = $(this).data('id');
					$.ajax({
						url:'https://api.mongohq.com/databases/thejoy/collections/activities/documents/'+id+'?_apikey=RHOyGeUiMIxBxMXSOtfyJ6FKaUQD9wfVmYFCJ3ehi4',
						type:"DELETE",
						dataType:"json",
						success: function(){
						console.log('delete success');
							self.parent().parent().remove();
						},
						error: function(){

						}

					});
			    });
		    },
		    error: function(){

		    }
	    });

//	    $('#txtTweet1').val(options.tweetContent1);
//	    $('#txtTweet2').val(options.tweetContent2);
//	    $('#txtTweet3').val(options.tweetContent3);



    });

	// Trigger this method when updating a step. This allows JB to
	// update the wizard.
    //connection.trigger('updateStep', nextStep);

	// When everything has been configured for this activity, trigger
	// the save:
	// connection.trigger('save', 
});
