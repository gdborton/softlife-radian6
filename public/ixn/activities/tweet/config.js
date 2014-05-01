define([], function(){      
    return {
        "icon": "images/jb-icon.jpg",
        "iconSmall": "images/jb-icon.jpg", 
        "key": "softlife-tweet-activity",
        "partnerApiObjectTypeId": "IXN.CustomActivity.REST",
        "lang": {
            "en-US": {        
                "name": "Tweet",
                "description": "This activity sends tweets to users."
            }
        },
        "category": "messaging",
        "version": "1.0",
        "apiVersion": "1.0",
       "execute": {
            "uri": "https://softlife.herokuapp.com/ixn/activities/tweet/execute/",
			"inArguments": [
                { ArgumentName: "twitterHandle", "DefaultValue": "1 twitterHandle %%twitterHandle%% %twitterHandle%"},
                { ArgumentName: '%twitterHandle%', "DefaultValue": "2 twitterHandle %twitterHandle% %%twitterHandle%%" },
                { ArgumentName: '%%twitterHandle%%', "DefaultValue": "3 twitterHandle %twitterHandle% %%twitterHandle%%" },
                { ArgumentName: '%%jbdbc%%', "DefaultValue": "4 jbdbc %jbdbc% %%jbdbc%%" }
            ],
			"outArguments": [],
            "verb": "POST",
			"body": "{ \"subject\":\"%%twitterHandle%%'s Password Reset %%twitterHandle%% %%jbdbc%% %twitterHandle% Request\" }",
            "format": "json",
            "useJwt": false,
            "timeout": 3000
		},
        "save": {
            "uri": "https://softlife.herokuapp.com/ixn/activities/tweet/save/",
			"verb": "POST",
			"body": "",
            "format": "json",
            "useJwt": false,
            "timeout": 3000
        },
        "publish": {
            "uri": "https://softlife.herokuapp.com/ixn/activities/tweet/publish/",
            "verb": "POST",
			"body": "",
            "format": "json",
            "useJwt": false,
            "timeout": 3000
        },
        "validate": {
            "uri": "https://softlife.herokuapp.com/ixn/activities/tweet/validate/",
            "verb": "POST",
			"body": "",
            "format": "json",
            "useJwt": false,
            "timeout": 3000
        },

        "edit": {
            "uri": "https://softlife.herokuapp.com/ixn/activities/tweet/",
            "height": 400,
            "width": 500
        }
};
});
