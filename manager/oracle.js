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

	oracleManager.facebookAbos = async function (pageName,idPost) {
		return new Promise(async (resolve, reject) => {
				res2 = await app.db.query("Select pt.token as token from classed.fb_page_token pt,classed.fb_page_fb pf where pf.id = pt.page and  pf.username = '"+pageName+"'");
				if(res2 && res2.length) {
					var token = res2[0].token;
				var res = await rp({uri:"https://graph.facebook.com/"+app.config.fbGraphVersion+"/"+pageName+"?access_token="+token+"&fields=fan_count",json: true});
			resolve(res.data.fan_count);
		}
		else {
				resolve(0);
		}
		});
	};

	oracleManager.youtubeAbos = async function (idPost) {
		return new Promise(async (resolve, reject) => {
			var res = await rp({uri:'https://www.googleapis.com/youtube/v3/videos',qs:{id:idPost,key:app.config.gdataApiKey,part:"snippet"},json: true});
			var channelId = res.items[0].snippet.channelId;
			var res = await rp({uri:'https://www.googleapis.com/youtube/v3/channels',qs:{id:channelId,key:app.config.gdataApiKey,part:"statistics"},json: true});
			resolve(res.items[0].statistics.subscriberCount);
		});
	};

	oracleManager.instagramAbos = async function (idPost) {
		return new Promise(async (resolve, reject) => {
			var res = await rp({uri:"https://api.instagram.com/oembed/?url=https://www.instagram.com/p/"+idPost+"/",json: true});
			var username = res.author_name;
			res2 = await app.db.query("Select pi.instagram_id as igid,pt.token as token from classed.fb_page_instagram pi,classed.fb_page_token pt where pi.page_fb = pt.page and  pi.username = '"+username+"'");
			if(res2 && res2.length) {
				var ig = res2[0].igid;
				var token = res2[0].token;
				var res3 = await rp({uri:"https://graph.facebook.com/"+app.config.fbGraphVersion+"/"+ig+"?access_token="+token+"&fields=followers_count",json: true});
				resolve(res3.followers_count)
			}



			else {
				resolve(0);
		}
		});
	};

	oracleManager.twitterAbos = async function (pageName,idPost) {
		return new Promise(async (resolve, reject) => {
			var res = await tweet.get('users/show',{screen_name :pageName});
			resolve(res.followers_count);
		});
	};





	oracleManager.facebook = async function (pageName,idPost) {
		return new Promise(async (resolve, reject) => {
			res = await app.db.query("Select pt.token as token, pf.page_id as page_id from classed.fb_page_token pt,classed.fb_page_fb pf where pf.id = pt.page  and  pf.username = '"+pageName+"'");
			if(res && res.length) {
				var token = res[0].token;
				var idPage = res[0].page_id;


				//console.log("https://graph.facebook.com/v3.2/"+idPage+"_"+idPost+"?fields=shares,likes.summary(true)&access_token="+app.FB.appAccessToken);
				var res2 = await rp({uri:"https://graph.facebook.com/"+app.config.fbGraphVersion+"/"+idPage+"_"+idPost+"?fields=shares,likes.summary(true)&access_token="+token,json: true});

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

					resolve(perf);
				}

				else {
					resolve({shares:0,likes:0,views:0});
			}

		})
	};



	oracleManager.youtube = async function (idPost) {
		return new Promise(async (resolve, reject) => {
			if( -1 != idPost.indexOf("&"))
			{
				idPost = idPost.split("&")[0];
			}
			var perf = {shares:0,likes:0,views:0};
			var body = await rp({uri:'https://www.googleapis.com/youtube/v3/videos',qs:{id:idPost,key:app.config.gdataApiKey,part:"statistics"}});
			var res = JSON.parse(body);
			if(res.items && res.items[0])
			{

			perf = {shares:res.items[0].statistics.commentCount,likes:res.items[0].statistics.likeCount,views:res.items[0].statistics.viewCount,date:Math.floor(Date.now()/1000)};
		 }



			resolve(perf);
		})

	};

	oracleManager.instagram = async function (idPost) {
		return new Promise(async (resolve, reject) => {
				var perf = {shares:0,likes:0,views:0};
				var res = await rp({uri:"https://api.instagram.com/oembed/?url=https://www.instagram.com/p/"+idPost+"/",json: true});
				var username = res.author_name;
				res2 = await app.db.query("Select pi.instagram_id as igid,pt.token as token from classed.fb_page_instagram pi,classed.fb_page_token pt where pi.page_fb = pt.page and  pi.username = '"+username+"'");
				if(res2 && res2.length) {
					var ig = res2[0].igid;
					var token = res2[0].token;
					var mediaId = false;
					var cur = await rp({uri:"https://graph.facebook.com/"+app.config.fbGraphVersion+"/"+ig+"/media?access_token="+token+"&fields=permalink,like_count",json: true});

					while (cur.paging.next) {
						for(var i = 0 ;i<cur.data.length;i++)
						{
							if ("https://www.instagram.com/p/"+idPost+"/" == cur.data[i].permalink) {
								resolve({shares:0,likes:cur.data[i].like_count,views:0})
								return;
							}
						}
						cur = await rp({uri:cur.paging.next,json: true});
					}


				}



				else {
					resolve(perf);
			}

		})

	};

	oracleManager.twitter = async function (userName,idPost) {

		return new Promise(async (resolve, reject) => {



			var res = await tweet.get('statuses/show',{id:idPost});

			var perf = {shares:res.retweet_count,likes:res.favorite_count,views:0,date:Math.floor(Date.now()/1000)};


			resolve(perf);
		})
	};


	oracleManager.getPromDetails = async function (idProm) {
		return new Promise(async (resolve, reject) => {
		try {
		var ctr = await app.campaign.getPromContract(idProm);
		if(ctr){
			ctr.methods.proms(idProm).call().then(function (results) {
			delete(results.results)
			resolve(results);
			});
			};
		}catch (err) {
			reject({message:err.message});
		}
		})
	};
	app.oracle = oracleManager;
	return app;
}
