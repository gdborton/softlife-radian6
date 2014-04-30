'use strict';
define( function( require ) {
    // Dependencies
    var Postmonger = require('postmonger');
    require( 'jquery.min' );
    require( 'underscore' );

    // Vars
    var connection = new Postmonger.Session();
    var $twitterFollowers = $('#twitter-followers');
    var data, uiPayload, etPayload;

    // Once we know the window is loaded
    $(window).ready( function() {
        // Notify Journey Builder our window is loaded
        connection.trigger('ready');

        // Allow Marketers to configure the value
        $twitterFollowers.removeAttr( 'disabled' );
    });

    connection.on( 'updateStep', function( step ) {
        var value = $twitterFollowers.val();
        if( !value ) {
            // Notify user they need to select a value 
            $('#helloWorldTriggerConfigError').html('<strong style="color: red;">You must enter something</strong>');
        } else {
            // Successful change
            // When we're all done, define our payload
            data = {
                twitterFollowers: $twitterFollowers.val()
            };

            uiPayload = {
                options: data,
                description: 'This is a hello world trigger configuration instance.'
            };

            etPayload = {
                filter: "<FilterDefinition Source='SubscriberAttribute'><ConditionSet Operator='AND' ConditionSetName='Grouping'><Condition ID='268133f8-fbcf-e311-9ae6-ac162db18844' isParam='false' Operator='GreaterThanOrEqual' operatorTemplate='undefined' operatorEditable='1' valueEditable='1' conditionValid='1'><Value><![CDATA[" + data.twitterFollowers + "]]></Value></Condition><Condition ID='248133f8-fbcf-e311-9ae6-ac162db18844' isParam='false' Operator='IsNotNull' operatorTemplate='undefined' operatorEditable='1' valueEditable='1' conditionValid='1'><Value><![CDATA[]]></Value></Condition><Condition ID='228133f8-fbcf-e311-9ae6-ac162db18844' isParam='false' Operator='IsNotNull' operatorTemplate='undefined' operatorEditable='1' valueEditable='1' conditionValid='1'><Value><![CDATA[]]></Value></Condition></ConditionSet></FilterDefinition>"
            };

            connection.trigger( 'save', uiPayload, etPayload );
        }
    });

    // Populate Fields is sent from Journey Builder to this Custom
    // Trigger UI via Postmonger (iframe-to-iframe communication).
    connection.on('populateFields', function( options ) {
        //console.log( 'Journey Builder sent Hello World Trigger a populateFields notice with the following data' );
        if( options ) {
            //console.log( 'OPTIONS: ', options );
            // Persist
            $('#twitter-followers').val( options.twitterFollowers );
        }
    });

/*
FILTER XML IDS FROM: https://jbprod.exacttargetapps.com/rest/v1/contact/definition/?oauth_token=NONE&_=1392167891474
*/
});
