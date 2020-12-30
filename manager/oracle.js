module.exports = async function (app) {

	var request = require('request');
	var rp = require('request-promise');
	var fs = require("fs");
	var Twitter = require('twitter');
	var jsdomlib = require("jsdom");
	var jsdom = jsdomlib.JSDOM;

	var tweet = new Twitter({
	  consumer_key: app.config.twitter.consumer_key,
	  consumer_secret: app.config.twitter.consumer_secret,
	  access_token_key: app.config.twitter.access_token_key,
	  access_token_secret: app.config.twitter.access_token_secret
	});

	var oracleManager = {};

	var campaignKeystore = fs.readFileSync(app.config.campaignWalletPath,'utf8');
	app.campaignWallet = JSON.parse(campaignKeystore);

	/*oracleManager.parseSign = function (data) {
		data = data.slice(2);
		var ret = {};
		ret.r = "0x"+data.slice(0, 64);
		ret.s = "0x"+data.slice(64, 128);
		ret.v = app.web3.utils.hexToNumber(data.slice(128, 130));
		return ret;
	}*/

	oracleManager.facebookAlt = async function (pageName,idPost) {
		return new Promise(async (resolve, reject) => {
			//app.FB.api(pageName,{ access_token: "" }, async function (res) {

				var res = await rp({uri:"https://graph.facebook.com/v3.2/"+pageName+"?access_token="+app.FB.appAccessToken,json: true});
				console.log("pageres",res);
				var idPage = res.id;
				console.log("https://graph.facebook.com/v3.2/"+idPage+"_"+idPost+"?fields=shares,likes.summary(true)&access_token="+app.FB.appAccessToken);
				var res2 = await rp({uri:"https://graph.facebook.com/v3.2/"+idPage+"_"+idPost+"?fields=shares,likes.summary(true)&access_token="+app.FB.appAccessToken,json: true});

				//app.FB.api(idPage+"_"+idPost+"?fields=shares,likes.summary(true)",{ access_token: app.FB.appAccessToken }, async function (res2) {
					var shares = 0;
					if(res2.error)
					{
						console.log(res2)
						reject({error:"Invalid url"});
						return;
					}
					if(res2.shares)
					{
						shares = res2.shares.count;
					}
					var perf = {shares:shares,likes:res2.likes.summary.total_count,views:0,date:Math.floor(Date.now()/1000)};
					app.web3.eth.accounts.wallet.decrypt([app.campaignWallet], app.config.campaignOwnerPass);
					var h1 = app.web3.utils.sha3(app.web3.eth.abi.encodeParameters(['uint8','string','string','uint64','uint64','uint64','uint64'],[1,idPost,"",perf.shares,perf.likes,perf.views,perf.date]));
					var sign = await app.web3.eth.sign(h1,app.config.campaignOwner);
					perf.r = sign.r;
					perf.s = sign.s;
					perf.v = sign.v;
					resolve(perf);
				//});
			//})
		})
	};

	oracleManager.facebook = async function (pageName,idPost) {
		return new Promise(async (resolve, reject) => {

			var res = await rp({uri:"http://geoffreymoya.hopto.org:3014/fb/page/"+pageName+"/"+idPost,json: true})


					var perf = {shares:res.shares,likes:res.likes,views:0,date:Math.floor(Date.now()/1000)};
					app.web3.eth.accounts.wallet.decrypt([app.campaignWallet], app.config.campaignOwnerPass);
					var h1 = app.web3.utils.sha3(app.web3.eth.abi.encodeParameters(['uint8','string','string','uint64','uint64','uint64','uint64'],[1,idPost,"",perf.shares,perf.likes,perf.views,perf.date]));
					var sign = await app.web3.eth.sign(h1,app.config.campaignOwner);
					perf.r = sign.r;
					perf.s = sign.s;
					perf.v = sign.v;
					resolve(perf);
				//}

		})
	};

	oracleManager.youtube = async function (idPost) {
		return new Promise(async (resolve, reject) => {
			if( -1 != idPost.indexOf("&"))
			{
				idPost = idPost.split("&")[0];
			}
			var body = await rp({uri:'https://www.googleapis.com/youtube/v3/videos',qs:{id:idPost,key:app.config.gdataApiKey,part:"statistics"}});
			var res = JSON.parse(body);
			console.log(res);
			//await app.web3.eth.personal.unlockAccount(app.config.campaignOwner,app.config.campaignOwnerPass,app.web3.utils.toHex(15000));
			//app.web3.eth.accounts.wallet.decrypt([app.campaignWallet], app.config.campaignOwnerPass);
			var perf = {shares:res.items[0].statistics.commentCount,likes:res.items[0].statistics.likeCount,views:res.items[0].statistics.viewCount,date:Math.floor(Date.now()/1000)};

		   /* var h1 = app.web3.utils.sha3(app.web3.eth.abi.encodeParameters(['uint8','string','string','uint64','uint64','uint64','uint64'],[2,idPost,"",perf.shares,perf.likes,perf.views,perf.date]));
			var sign = await app.web3.eth.sign(h1,app.config.campaignOwner);
			perf.r = sign.r;
			perf.s = sign.s;
			perf.v = sign.v;*/
			resolve(perf);
		})

	};

	oracleManager.instagram = async function (idPost) {
		return new Promise(async (resolve, reject) => {

			var perf = await rp({uri:"http://geoffreymoya.hopto.org:3014/insta/"+idPost,json: true})

			/*var body = await rp({uri:"https://www.instagram.com/p/"+idPost});
			var part = body.split('<meta property="og:description" content="')[1];
			var part2 = part.split(' ');
			var likes = parseFloat(part2[0]);
			if( part2[0].indexOf("k")!=-1)
				likes *= 1000;
			var shares = parseFloat(part2[2]);
			if( part2[2].indexOf("k")!=-1)
				shares *= 1000;*/
			//app.web3.eth.accounts.wallet.decrypt([app.campaignWallet], app.config.campaignOwnerPass);
			//var perf = {likes:likes,shares:shares,views:0,date:Math.floor(Date.now()/1000)};
			/*var h1 = app.web3.utils.sha3(app.web3.eth.abi.encodeParameters(['uint8','string','string','uint64','uint64','uint64','uint64'],[3,idPost,"",perf.shares,perf.likes,perf.views,perf.date]));
			var sign = await app.web3.eth.sign(h1,app.config.campaignOwner);
			perf.r = sign.r;
			perf.s = sign.s;
			perf.v = sign.v;
			resolve(perf);*/
		})

	};

	oracleManager.twitter = async function (userName,idPost) {

		return new Promise(async (resolve, reject) => {


			/*var body = await rp({uri:"https://twitter.com/"+userName+"/status/"+idPost});
			var parts = body.split('data-tweet-stat-count=');
			var partT = parts[1];
			var partL = parts[2];*/
			var res = await tweet.get('statuses/show',{id:idPost});

			var perf = {shares:res.retweet_count,likes:res.favorite_count,views:0,date:Math.floor(Date.now()/1000)};

			//var perf = {shares:partT.split('"')[1],likes:partL.split('"')[1],views:0,date:Math.floor(Date.now()/1000)};
			//app.web3.eth.accounts.wallet.decrypt([app.campaignWallet], app.config.campaignOwnerPass);
			//var h1 = app.web3.utils.sha3(app.web3.eth.abi.encodeParameters(['uint8','string','string','uint64','uint64','uint64','uint64'],[4,idPost,userName,perf.shares,perf.likes,perf.views,perf.date]));
			//console.log(h1,app.config.campaignOwner)
			/*var sign = await app.web3.eth.sign(h1,app.config.campaignOwner);
			perf.r = sign.r;
			perf.s = sign.s;
			perf.v = sign.v;*/

			resolve(perf);
		})
	};

	app.oracle = oracleManager;
	return app;
}
