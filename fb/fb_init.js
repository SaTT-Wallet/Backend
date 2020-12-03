module.exports = async function (app ) {
	var FB = require('fb');
	FB.options({version: 'v3.2'});
	
	
	
	var FBIframe = FB.extend({appId: app.config.appId, appSecret: app.config.appSecret});
	
	var FB = {};
	
	FBIframe.api('oauth/access_token', {
		client_id: app.config.appId,
		client_secret: app.config.appSecret,
		grant_type: 'client_credentials'
			}, function (res) {
		if(!res || res.error) {
			console.log(!res ? 'error occurred' : res.error);
			return;
		}
		
		FB.appAccessToken = res.access_token;
		console.log(FB.appAccessToken)
		
	});
	
	
	
	
	FB.api = function (url,params,callback) {
		FBIframe.api(url,params,function(res){
			callback(res);
		})
	}
	
	app.FB = FB;
	
	
	return app;
}

