module.exports = async function (app) {

	var request = require('request');
	var rp = require('request-promise');
	var fs = require("fs");
	var Twitter = require('twitter');

	var Twitter2 = require('twitter-v2');
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

				var page = await app.db.fbPage().findOne({username: pageName});

				if(page) {
					var token = page.token;
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
				var ig_media = await app.db.ig_media().findOne({shortCode: idPost});
			var ig_user = ig_media.owner;
			fbProfile = await app.db.fbProfile().findOne({instagram_id:ig_user  });

			if(fbProfile) {
				var token = fbProfile.accessToken;
				var res3 = await rp({uri:"https://graph.facebook.com/"+app.config.fbGraphVersion+"/"+ig_user+"?access_token="+token+"&fields=followers_count",json: true});
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

			var page = await app.db.fbPage().findOne({username: pageName});
			if(page) {
				var token = page.token;
				var idPage = page.id;

				var res2 = await rp({uri:"https://graph.facebook.com/"+app.config.fbGraphVersion+"/"+idPage+"_"+idPost+"?fields=shares&access_token="+token,json: true});
				var res3 = await rp({uri:"https://graph.facebook.com/"+app.config.fbGraphVersion+"/"+idPage+"_"+idPost+"/insights?metric=post_reactions_by_type_total,post_impressions&period=lifetime&access_token="+token,json: true});


					var shares = 0;
					if(res2.error || res3.error)
					{
						reject({error:"Invalid url"});
						return;
					}
					if(res2.shares)
					{
						shares = res2.shares.count;
					}
					var likes = res3.data[0].values[0].value.like;
					var views = res3.data[1].values[0].value;
					var perf = {shares:shares,likes:likes,views:views,date:Math.floor(Date.now()/1000)};

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

				var ig_media = await app.db.ig_media().findOne({shortcode: idPost});
				if(!ig_media)
					resolve({error:"media not found"});
			  var ig_user = ig_media.owner.id;
				var media_id = ig_media.id;
				var fbProfile = await app.db.fbProfile().findOne({instagram_id: ig_user});
				var token = fbProfile.accessToken;

					var cur = await rp({uri:"https://graph.facebook.com/"+app.config.fbGraphVersion+"/"+media_id+"/insights?metric=engagement,impressions&access_token="+token,json: true}).catch(async function (e) {
						var cur = await rp({uri:"https://graph.facebook.com/"+app.config.fbGraphVersion+"/"+media_id+"?fields=like_count&access_token="+token,json: true});
						resolve({shares:0,likes:cur.like_count,views:0})
					});
						resolve({shares:0,likes:cur.data[0].values[0].value,views:cur.data[1].values[0].value})

				}

		)

	};

	oracleManager.twitter = async function (userName,idPost) {

		return new Promise(async (resolve, reject) => {

			  var twitterProfile = await app.db.twitterProfile().findOne({username:userName  });

				if(!twitterProfile)
				{
					var tweet = new Twitter({
						consumer_key: app.config.twitter.consumer_key_alt,
						consumer_secret: app.config.twitter.consumer_secret_alt,
						access_token_key: app.config.access_token_key,
						access_token_secret: app.config.access_token_secret
					});
					var res = await tweet.get('statuses/show',{id:idPost});
					var perf = {shares:res.retweet_count,likes:res.favorite_count,views:0,date:Math.floor(Date.now()/1000)};
					resolve(perf);
					return;
				}


			var tweet = new Twitter2({
			  consumer_key: app.config.twitter.consumer_key,
			  consumer_secret: app.config.twitter.consumer_secret,
			  access_token_key: twitterProfile.access_token_key,
			  access_token_secret: twitterProfile.access_token_secret
			});
			var res = await tweet.get('tweets' ,{ids:idPost,'tweet.fields':"public_metrics,non_public_metrics"});
			if(res.errors)
			{
				res = await tweet.get('tweets' ,{ids:idPost,'tweet.fields':"public_metrics"});
				var perf = {shares:res.data[0].public_metrics.retweet_count,likes:res.data[0].public_metrics.like_count,date:Math.floor(Date.now()/1000)};
				resolve(perf);
				return;
			}

			var perf = {shares:res.data[0].public_metrics.retweet_count,likes:res.data[0].public_metrics.like_count,/*views:res.data[0].non_public_metrics.impression_count,*/date:Math.floor(Date.now()/1000)};



			resolve(perf);
		})
	};

	oracleManager.verifyFacebook = async function (userId,pageName) {
		return new Promise(async (resolve, reject) => {
			try {
				var page = await app.db.fbPage().findOne({username: pageName,UserId:userId});
				resolve(page);

			}catch (err) {
				reject({message:err.message});
			}
		})
	}

	oracleManager.verifyYoutube = async function (userId,idPost) {
		return new Promise(async (resolve, reject) => {
			try {
				var res = await rp({uri:'https://www.googleapis.com/youtube/v3/videos',qs:{id:idPost,key:app.config.gdataApiKey,part:"snippet"},json: true});
				var channelId = res.items[0].snippet.channelId;
				var googleProfile = await app.db.googleProfile().findOne({UserId:userId,channelId:channelId  });
				resolve(googleProfile);

			}catch (err) {
				reject({message:err.message});
			}
		})
	}

	oracleManager.verifyInsta = async function (userId,idPost) {
		return new Promise(async (resolve, reject) => {
			try {
				var ig_media = await app.db.ig_media().findOne({shortcode: idPost});
				if(!ig_media) {
					resolve(false);
				}
				else {
					var ig_user = ig_media.owner.id;
					var fbProfile = await app.db.fbProfile().findOne({instagram_id: ig_user});
					resolve(fbProfile);
				}

			}catch (err) {
				reject({message:err.message});
			}
		})
	}

	oracleManager.verifyTwitter = async function (userId,idPost) {
		return new Promise(async (resolve, reject) => {
			try {
				var twitterProfile = await app.db.twitterProfile().findOne({UserId:userId  });
				var tweet = new Twitter2({
				  consumer_key: app.config.twitter.consumer_key,
				  consumer_secret: app.config.twitter.consumer_secret,
				  access_token_key: twitterProfile.access_token_key,
				  access_token_secret: twitterProfile.access_token_secret
				});
				var res = await tweet.get('tweets' ,{ids:idPost,'tweet.fields':"author_id"});
				resolve(res.data[0].author_id == twitterProfile.id)

			}catch (err) {
				reject({message:err.message});
			}
		})
	}


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
