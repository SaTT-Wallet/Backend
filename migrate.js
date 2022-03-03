

// passer collection sur meme db

console.log("migrate start")

var mongo = require('mongodb');
var mongoClient = mongo.MongoClient;


var child = require('child_process');


var configSource = {
    mongoUser:"",
    mongoPass:"",
    mongoHost:"mongodb.contact-form.net",
    mongoPort:"27017",
    mongoBase:"ether",
    mongoBaseAtn:"atayen",
}

var configTarget = {
    mongoUser:"",
    mongoPass:"",
    mongoHost:"",
    mongoPort:"",
    mongoBase:""
}

var urlSource = "mongodb://" + configSource.mongoUser + ":" + configSource.mongoPass + "@" + configSource.mongoHost + ":" + configSource.mongoPort;
var urlTarget = "mongodb://" + configTarget.mongoUser + ":" + configTarget.mongoPass + "@" + configTarget.mongoHost + ":" + configTarget.mongoPort;

var dbSource = await mongoClient.connect(urlSource, {useNewUrlParser: true,useUnifiedTopology: true}).catch(console.log)
    
var dbTarget = await mongoClient.connect(urlTarget, {useNewUrlParser: true,useUnifiedTopology: true}).catch(console.log)

console.log("migrate collection sn_user")
	

var wallets = await dbSource.db(configSource.mongoBase).collection("wallet").find().toArray();

for(var i = 0;i<wallets.length;i++) {
    var wallet = wallets[i];
    var user = await dbSource.db(configSource.mongoBaseAtn).collection("sn_user").findOne({_id:wallet.UserId});
    if(user)
        await dbTarget.db(configTarget.mongoBase).collection("sn_user").insertOne(user);
}

console.log("migrate collection request")

var requests = await dbSource.db(configSource.mongoBase).collection("request").find().toArray();

for(var i = 0;i<requests.length;i++) {
    var request = requests[i];
    var isNew = request.isNew;
    delete(request.isNew)
    request.new = isNew;
    await dbTarget.db(configTarget.mongoBase).collection("request").insertOne(request);
    
}

console.log("migrate collection campaigns")

child.execSync('mongodump --uri="'+urlSource+'" --db='+configSource.mongoBaseAtn+' -c=campaigns --archive="campaigns-dump"');
child.execSync('mongorestore --uri="'+urlTarget+'" --db='+configTarget.mongoBase+' -c=campaigns --archive="campaigns-dump"');

console.log("migrate collection interests")

child.execSync('mongodump --uri="'+urlSource+'" --db='+configSource.mongoBaseAtn+' -c=interests --archive="interests-dump"');
child.execSync('mongorestore --uri="'+urlTarget+'" --db='+configTarget.mongoBase+' -c=interests --archive="interests-dump"');

console.log("migrate collection notification")

child.execSync('mongodump --uri="'+urlSource+'" --db='+configSource.mongoBaseAtn+' -c=notification --archive="notification-dump"');
child.execSync('mongorestore --uri="'+urlTarget+'" --db='+configTarget.mongoBase+' -c=notification --archive="notification-dump"');

console.log("migrate collection campaign_link")

child.execSync('mongodump --uri="'+urlSource+'" --db='+configSource.mongoBaseAtn+' -c=campaign_link --archive="campaign_link-dump"');
child.execSync('mongorestore --uri="'+urlTarget+'" --db='+configTarget.mongoBase+' -c=campaign_link --archive="campaign_link-dump"');

console.log("migrate collection captcha")

child.execSync('mongodump --uri="'+urlSource+'" --db='+configSource.mongoBaseAtn+' -c=captcha --archive="captcha-dump"');
child.execSync('mongorestore --uri="'+urlTarget+'" --db='+configTarget.mongoBase+' -c=captcha --archive="captcha-dump"');

console.log("migrate collection wallet")

child.execSync('mongodump --uri="'+urlSource+'" --db='+configSource.mongoBase+' -c=wallet --archive="wallet-dump"');
child.execSync('mongorestore --uri="'+urlTarget+'" --db='+configTarget.mongoBase+' -c=wallet --archive="wallet-dump"');

console.log("migrate collection google_profile")

child.execSync('mongodump --uri="'+urlSource+'" --db='+configSource.mongoBase+' -c=google_profile --archive="google_profile-dump"');
child.execSync('mongorestore --uri="'+urlTarget+'" --db='+configTarget.mongoBase+' -c=google_profile --archive="google_profile-dump"');

console.log("migrate collection fb_profile")

child.execSync('mongodump --uri="'+urlSource+'" --db='+configSource.mongoBase+' -c=fb_profile --archive="fb_profile-dump"');
child.execSync('mongorestore --uri="'+urlTarget+'" --db='+configTarget.mongoBase+' -c=fb_profile --archive="fb_profile-dump"');

console.log("migrate collection linkedin_profile")

child.execSync('mongodump --uri="'+urlSource+'" --db='+configSource.mongoBase+' -c=linkedin_profile --archive="linkedin_profile-dump"');
child.execSync('mongorestore --uri="'+urlTarget+'" --db='+configTarget.mongoBase+' -c=linkedin_profile --archive="linkedin_profile-dump"');

console.log("migrate collection twitter_profile")

child.execSync('mongodump --uri="'+urlSource+'" --db='+configSource.mongoBase+' -c=twitter_profile --archive="twitter_profile-dump"');
child.execSync('mongorestore --uri="'+urlTarget+'" --db='+configTarget.mongoBase+' -c=twitter_profile --archive="twitter_profile-dump"');

console.log("migrate collection fb_page")

child.execSync('mongodump --uri="'+urlSource+'" --db='+configSource.mongoBase+' -c=fb_page --archive="fb_page-dump"');
child.execSync('mongorestore --uri="'+urlTarget+'" --db='+configTarget.mongoBase+' -c=fb_page --archive="fb_page-dump"');

console.log("migrate collection custom_token")

child.execSync('mongodump --uri="'+urlSource+'" --db='+configSource.mongoBase+' -c=custom_token --archive="custom_token-dump"');
child.execSync('mongorestore --uri="'+urlTarget+'" --db='+configTarget.mongoBase+' -c=custom_token --archive="custom_token-dump"');

console.log("migrate collection event")

child.execSync('mongodump --uri="'+urlSource+'" --db='+configSource.mongoBase+' -c=event --archive="event-dump"');
child.execSync('mongorestore --uri="'+urlTarget+'" --db='+configTarget.mongoBase+' -c=event --archive="event-dump"');

console.log("migrate collection event")

child.execSync('mongodump --uri="'+urlSource+'" --db='+configSource.mongoBase+' -c=wallet_user_node --archive="wallet_user_node-dump"');
child.execSync('mongorestore --uri="'+urlTarget+'" --db='+configTarget.mongoBase+' -c=wallet_user_node --archive="wallet_user_node-dump"');

console.log("migrate end")





