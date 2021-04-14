module.exports = function (app) {

	var nodemailer = require('nodemailer');

	var transporter = nodemailer.createTransport(app.config.mailerOptions);

	var bodyParser = require('body-parser');
	app.use(bodyParser.urlencoded({ extended: false }));
	app.use( bodyParser.json() )

	const crypto = require('crypto');
	const hasha = require('hasha');

	var passport = require('passport');
	var emailStrategy = require('passport-local').Strategy;
	var FbStrategy = require('passport-facebook').Strategy;
	var GoogleStrategy = require('passport-google-oauth20').Strategy;
	var TwitterStrategy = require('passport-twitter').Strategy;
	var TelegramStrategy = require('passport-telegram').Strategy;

	var synfonyHash = function (pass) {
		var salted = pass+"{"+app.config.symfonySalt+"}";


		var buff = hasha(salted,{encoding:"buffer"});
		var saltBuff = Buffer.from(salted);
		var arr = [];

		for(var i=1;i<5000;i++)
		{
			arr = [buff,saltBuff];
			buff = hasha(Buffer.concat(arr),{algorithm:"sha512", encoding:"buffer"});
		}

		const base64 = buff.toString('base64');
		return base64;
	}

	 passport.use(new emailStrategy({passReqToCallback: true},
		async function(req,username, password, done) {
		var date = Math.floor(Date.now()/1000)+86400;
		var buff = Buffer.alloc(32);
		var token = crypto.randomFillSync(buff).toString('hex');
		var users = await app.db.sn_user().find({ email: username }).toArray();
		//console.log(users)
		if(users.length)
		{
			var user = users[0];
			if(user.idSn != 0)
			{
				return done("email already used",null);
			}
			var res = await app.db.query("Select id,password from user where id='"+user._id+"' ");
			if(res[0].password == synfonyHash(password))
			{
				var res_ins = await app.db.insert("INSERT INTO OAAccessToken SET ?",{client_id:1,user_id:user._id,token:token,expires_at:date,scope:"user"});
				return done(null,{id:res[0].id,token:token,expires_in:date,noredirect:req.body.noredirect});
			}
			else
				return done("auth failed",null);
		}
		else
		{
			var mongodate = new Date().toISOString();
			var mydate = mongodate.slice(0, 19).replace('T', ' ');
			var buff2 = Buffer.alloc(32);
			var code = crypto.randomFillSync(buff2).toString('hex');
			var res_ins = await app.db.insert("INSERT INTO user SET ?",{username:username,email:username,password:synfonyHash(password),created:mydate,updated:mydate,confirmation_token:code,enabled:0});
			var id = res_ins.insertId;
			var res_ins = await app.db.insert("INSERT INTO OAAccessToken SET ?",{client_id:1,user_id:id,token:token,expires_at:date,scope:"user"});
			var insert = await app.db.sn_user().insertOne({ _id:id,email: username,created :mongodate,updated:mongodate,idSn:0,locale:"en","userSatt": true});

			var mailOptions = {
			  from: app.config.mailSender,
			  to: username,
			  subject: 'Satt wallet activation',
			  html: '<a href="'+app.config.baseUrl+'auth/activate/'+id+"/"+code+'">Activate account</a>'
			};
			transporter.sendMail(mailOptions, function(error, info){
			  if (error) {
				console.log(error);
			  } else {
				console.log('Email sent: ' + info.response);
			  }
			});
			return done(null,{id:id,token:token,expires_in:date,noredirect:req.body.noredirect});
		};
	  }
	));


	passport.use(new FbStrategy({
    clientID: app.config.appId,
    clientSecret: app.config.appSecret,
    callbackURL: app.config.baseUrl+"callback/facebook",
	 profileFields: ['id', 'displayName', 'email',"picture.type(large)","token_for_business"]
	  },
	  async function(accessToken, refreshToken, profile, cb) {

		var date = Math.floor(Date.now()/1000)+86400;
		var buff = Buffer.alloc(32);
		var token = crypto.randomFillSync(buff).toString('hex');
		//console.log(profile);
	    var users = await app.db.sn_user().find({scopedId:profile.id}).toArray()
		if(users.length)
		{
			var user = users[0];
			if(user.idSn != 1)
			{
				return cb("email already used",null);
			}
			var res_ins = await app.db.insert("INSERT INTO OAAccessToken SET ?",{client_id:1,user_id:user._id,token:token,expires_at:date,scope:"user"});
			return cb(null,{id:user._id,token:token,expires_in:date});
		}
		else {
			var mongodate = new Date().toISOString();
			var mydate = mongodate.slice(0, 19).replace('T', ' ');
			var res_ins = await app.db.insert("INSERT INTO user SET ?",{username:profile.email,email:profile.email,created:mydate,updated:mydate,enabled:1});
			var id = res_ins.insertId;
			var res_ins = await app.db.insert("INSERT INTO OAAccessToken SET ?",{client_id:1,user_id:id,token:token,expires_at:date,scope:"user"});
			var insert = await app.db.sn_user().insertOne({
				_id:id,
				scopedId:profile.id,
				idOnSn:profile.token_for_business,
				email: profile.email,
				first_name:profile.first_name,
				name:profile.displayName,
				created :mongodate,
				updated:mongodate,
				idSn:1,
				locale:"en",
				picLink:profile.picture.data.url,
				userSatt: true
			});
			return cb(null,{id:id,token:token,expires_in:date});
		}
	}));




		passport.use(new GoogleStrategy({
			clientID:app.config.googleClientId,
			clientSecret: app.config.googleClientSecret,
			callbackURL: app.config.baseUrl+"callback/google"
		  },
		  async function(accessToken, refreshToken, profile, cb) {
			var date = Math.floor(Date.now()/1000)+86400;
			var buff = Buffer.alloc(32);
			var token = crypto.randomFillSync(buff).toString('hex');
			var users = await app.db.sn_user().find({idOnSn2:profile.id}).toArray()
			if(users.length)
			{
				var user = users[0];
				if(user.idSn != 2)
				{
					return cb("email already used",null);
				}
				var res_ins = await app.db.insert("INSERT INTO OAAccessToken SET ?",{client_id:1,user_id:user._id,token:token,expires_at:date,scope:"user"});
				return cb(null,{id:user._id,token:token,expires_in:date});
			}
			else {
				var mongodate = new Date().toISOString();
				var mydate = mongodate.slice(0, 19).replace('T', ' ');
				var res_ins = await app.db.insert("INSERT INTO user SET ?",{username:profile.email,email:profile.email,created:mydate,updated:mydate,enabled:1});
				var id = res_ins.insertId;
				var res_ins = await app.db.insert("INSERT INTO OAAccessToken SET ?",{client_id:1,user_id:id,token:token,expires_at:date,scope:"user"});
				var insert = await app.db.sn_user().insertOne({
					_id:id,
					idOnSn2:profile.id,
					email: profile.email,
					first_name:profile.given_name,
					name:profile.family_name,
					created :mongodate,
					updated:mongodate,
					idSn:2,
					locale:profile.locale,
					userSatt: true
				});
			return cb(null,{id:id,token:token,expires_in:date});
		  }
		}));

		/*

		passport.use(new TwitterStrategy({
			consumerKey: app.config.twitterClientId,
			consumerSecret: app.config.twitterClientSecret,
			callbackURL: app.config.baseUrl+"callback/twitter"
		  },
		  async function(token, tokenSecret, profile, cb) {

			 var date = Math.floor(Date.now()/1000)+86400;
			var buff = Buffer.alloc(32);
			var token = crypto.randomFillSync(buff).toString('hex');
			var users = await app.db.sn_user().find({idOnSn:profile.id}).toArray()
			if(users.length)
			{
				var user = users[0];
				if(user.idSn != 3)
				{
					return done("email already used",null);
				}
				var res_ins = await app.db.insert("INSERT INTO OAAccessToken SET ?",{client_id:1,user_id:user._id,token:token,expires_at:date,scope:"user"});
				return cb(null,{id:user._id,token:token,expires_in:date});
			}
			else {
				var mongodate = new Date().toISOString();
				var mydate = mongodate.slice(0, 19).replace('T', ' ');
				var res_ins = await app.db.insert("INSERT INTO user SET ?",{username:profile.email,email:profile.email,created:mydate,updated:mydate,enabled:1});
				var id = res_ins.insertId;
				var res_ins = await app.db.insert("INSERT INTO OAAccessToken SET ?",{client_id:1,user_id:id,token:token,expires_at:date,scope:"user"});
				var insert = await app.db.sn_user().insertOne({
					_id:id,
					idOnSn2:profile.id,
					email: profile.email,
					first_name:profile.given_name,
					name:profile.family_name,
					created :mongodate,
					updated:mongodate,
					idSn:3,
					locale:profile.locale,
					userSatt: true
				});
			return cb(null,{id:id,token:token,expires_in:date});
		  }

		  }
		));
		*/


		passport.use(
			new TelegramStrategy({
				clientID: app.config.telegramClientId,
				clientSecret: app.config.telegramClientSecret,
				callbackURL: app.config.baseUrl+"callback/telegram"
			},
			async function(accessToken, refreshToken, profile, cb) {

			var date = Math.floor(Date.now()/1000)+86400;
			var buff = Buffer.alloc(32);
			var token = crypto.randomFillSync(buff).toString('hex');
			var users = await app.db.sn_user().find({idOnSn3:profile.id}).toArray()
			if(users.length)
			{
				var user = users[0];
				if(user.idSn != 5)
				{
					return cb("email already used",null);
				}
				var res_ins = await app.db.insert("INSERT INTO OAAccessToken SET ?",{client_id:1,user_id:user._id,token:token,expires_at:date,scope:"user"});
				return cb(null,{id:user._id,token:token,expires_in:date});
			}
			else {
				var mongodate = new Date().toISOString();
				var mydate = mongodate.slice(0, 19).replace('T', ' ');
				var res_ins = await app.db.insert("INSERT INTO user SET ?",{username:profile.email,email:profile.username,created:mydate,updated:mydate,enabled:1});
				var id = res_ins.insertId;
				var res_ins = await app.db.insert("INSERT INTO OAAccessToken SET ?",{client_id:1,user_id:id,token:token,expires_at:date,scope:"user"});
				var insert = await app.db.sn_user().insertOne({
					_id:id,
					idOnSn3:profile.id,
					email: profile.email,
					first_name:profile.first_name,
					lastName:profile.last_name,
					name:profile.username,
					picLink:profile.photo_url,
					created :mongodate,
					updated:mongodate,
					idSn:5,
					locale:"en",
					userSatt: true
				});
			return cb(null,{id:id,token:token,expires_in:date});
		  }

		  }
		 ));


	passport.serializeUser(function(user, cb) {
	  cb(null, user.id);
	});

	passport.deserializeUser(async function(id, cb) {
		var users = await app.db.sn_user().find({ _id: id }).toArray();
		cb(null, users[0]);
	});

	try {
	app.use(passport.initialize());
	app.use(passport.session());
	}
		catch(e) {
			console.log(e)
		}




	app.post('/auth/email',passport.authenticate('local'), async function(req, response) {

		var param = {"access_token":req.user.token,"expires_in":req.user.expires_in,"token_type":"bearer","scope":"user"};
		if(req.user.noredirect)
		{
			response.end(JSON.stringify(param))
		}
		else {
		response.redirect(app.config.walletUrl + "login?token=" + JSON.stringify(param))
	}
	});

	app.get('/auth/fb',passport.authenticate('facebook'));

	app.get('/auth/google',passport.authenticate('google', { scope: ['profile'] }));

	app.get('/auth/twitter',passport.authenticate('twitter'));

	app.get('/auth/telegram', passport.authenticate('telegram'));






	app.get('/callback/facebook', passport.authenticate('facebook', { failureRedirect: '/login' }),async function(req, response) {
		//console.log(req.user)
		var param = {"access_token":req.user.token,"expires_in":req.user.expires_in,"token_type":"bearer","scope":"user"};
		if(req.user.noredirect)
		{
			response.end(JSON.stringify(param))
		}
		else {
		response.redirect(app.config.walletUrl + "login?token=" + JSON.stringify(param))
	}
	});

	app.get('/callback/google',passport.authenticate('google', { scope: ['profile'] }), async function(req, response) {
		//console.log(req.user)
		var param = {"access_token":req.user.token,"expires_in":req.user.expires_in,"token_type":"bearer","scope":"user"};
		response.redirect(app.config.walletUrl + "login?token=" + JSON.stringify(param))
	});

	app.get('/callback/twitter',passport.authenticate('twitter'), async function(req, response) {
		//console.log(req.user)
		var param = {"access_token":req.user.token,"expires_in":req.user.expires_in,"token_type":"bearer","scope":"user"};
		response.redirect(app.config.walletUrl + "login?token=" + JSON.stringify(param))
	});

	app.get('/callback/telegram', passport.authenticate('telegram'),async function(req, response) {
		//console.log(req.user)
		var param = {"access_token":req.user.token,"expires_in":req.user.expires_in,"token_type":"bearer","scope":"user"};
		response.redirect(app.config.walletUrl + "login?token=" + JSON.stringify(param))
	});


	app.get('/auth/activate/:id/:code', async function(req, response) {
		var code = req.params.code;
		var id = req.params.id;
		var res = await app.db.query("Select id,confirmation_token,enabled from user where id='"+id+"' ");
		if(res.enabled)
		{
			response.end('{error:"account already activated"}');
			return;
		}
		if(res.confirmation_token != code)
		{
			response.end('{error:"wrong activation"}');
			return;
		}
		var res_ins = await app.db.insert("UPDATE user SET ? WHERE id="+id+" ",{confirmation_token:"",enabled:1});
		response.end('{message:"activated"}');


	});

	app.get('/auth/passlost', async function(req, response) {

		var mail = req.params.mail;
		var res = await app.db.query("Select id from user where email='"+mail+"' ");
		if(!res.length)
		{
			response.end('{error:"account not exists"}');
			return;
		}
		var buff = Buffer.alloc(64);
		var token = crypto.randomFillSync(buff).toString('hex');
		var res_ins = await app.db.insert("UPDATE user SET ? WHERE id="+res[0].id+" ",{confirmation_token:token});

		var mailOptions = {
			  from: app.config.mailSender,
			  to: username,
			  subject: 'Satt wallet password recover',
			  html: '<form action="'+app.config.baseUrl+'auth/passrecover">'+
			  '<input type="hidden" name="id" value="'+res[0].id+'">'+
			  '<input type="hidden" name="code" value="'+token+'">'+
			  '<input type="password" name="newpass" >'+
			  '<input type="submit" name="submit" >Change</input>'+
			  '</form>'
			};
			/*transporter.sendMail(mailOptions, function(error, info){
			  if (error) {
				console.log(error);
			  } else {
				console.log('Email sent: ' + info.response);
			  }
			});*/


		response.end('{message:"mail sent"}');

	});

	app.post('/auth/passchange', async function(req, response) {

		var newpass = req.body.newpass;
		var oldpass = req.body.oldpass;
		var id = req.body.id;
		var res = await app.db.query("Select id,password,enabled from user where id='"+id+"' ");
		if(!res.enabled)
		{
			response.end('{error:"account not activated"}');
			return;
		}
		if(res.password != synfonyHash(oldpass))
		{
			response.end('{error:"wrong password"}');
			return;
		}
		var res_ins = await app.db.insert("UPDATE user SET ? WHERE id="+id+"",{password:synfonyHash(newpass)});
		response.end('{message:"activated"}');


	});

	app.post('/auth/passrecover', async function(req, response) {


		var newpass = req.body.newpass;
		var code = req.body.code;
		var id = req.body.id;
		var res = await app.db.query("Select id,confirmation_token,enabled from user where id='"+id+"' ");
		if(res.confirmation_token != code)
		{
			response.end('{error:"wrong activation"}');
			return;
		}
		var res_ins = await app.db.insert("UPDATE user SET ? WHERE id="+id+" ",{password:synfonyHash(newpass),confirmation_token:"",enabled:1});
		response.end('{message:"activated"}');
	});



	return app;

}
