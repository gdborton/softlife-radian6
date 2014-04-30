'use strict';
/**
 * Handle clicks in the UI
 */

// Make sure jQuery is loaded first
$(function() {

    // Cache some vars
    var $emailInput     = $('#primary-email-address');
    var $twitterHandle  = $('#twitter-handle');
    var $emailSubmit    = $('#emailSubmit');
    var $reset          = $('#reset');
    var $clear          = $('#clear');
    var $fetch          = $('#fetch');
    var $results        = $('ul.results');

    // When someone submits this form, fire the event to the custom trigger
    $emailSubmit.on('click', function( evt ) {
        var primaryEmailAddress    = $emailInput.val();
        var twitterHandle      = $twitterHandle.val();
        var reqBody     = {
            primaryEmailAddress: primaryEmailAddress,
            twitterHandle: twitterHandle,
            twitterFollowers: 0
        };
        
        // Disable the inputs until we receive a resposne
        $emailInput.attr( 'disabled', 'disabled' );
        $twitterHandle.attr( 'disabled', 'disabled' );
        $emailSubmit.attr( 'disabled', 'disabled' );

        $.ajax( '/fireEvent/helloWorld', {
            type: 'POST',
            data: reqBody,
            error: function( xhr, status, error ) {
                //console.log( 'ERROR: ', error );
                $('ul.events').append( '<li>Error: ' +  error + '</li>' );
            },
            success: function( data, status, xhr ) {
                //console.log( 'Response from Journey Builder: ', data );
                $('ul.events').append( '<li>EventInstanceId: ' + String(data) + '</li>' );
            },
            complete: function() {
                // Enable the inputs until we receive a resposne
                $emailInput.removeAttr( 'disabled' );
                $twitterHandle.removeAttr( 'disabled' );
                $emailSubmit.removeAttr( 'disabled' );
            }
        });
    });

    $clear.on('click', function( evt ) {
        $.ajax( '/clearList', {
            error: function( xhr, status, error ) {
                console.log( 'ERROR: ', error );
            },
            success: function( data, status, xhr ) {
                $results.html( '' );
            }
        });
    });

    $fetch.on('click', function( evt ) {
        $.ajax( '/getActivityData', {
            type: 'GET',
            dataType: 'json',
            error: function( xhr, status, error ) {
                console.log( 'ERROR: ', error );
            },
            success: function( data, status, xhr ) {
                if( !data.data ) {
                    $results.append( '<li>There are no logs in the list</li>' );
                } else {
                    var dataLength = data.data.length;
                    while( dataLength-- ) {
                        $results.append( '<li><code><pre>'+ JSON.stringify( data.data[dataLength], null, 4 ) +'</pre></code></li>' );
                    }
                }
            }
        });
    });
});
