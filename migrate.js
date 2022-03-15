(async function() {

    // passer collection sur meme db
    
    console.log("migrate start")
    
    var mongo = require('mongodb');
    var mongoClient = mongo.MongoClient;
    
    
    var child = require('child_process');
    
    
    var configSource = {
        mongoUser:"",
        mongoPass:"",
        mongoHost:"",
        mongoPort:"",
        mongoBase:"ether",
        mongoBaseAtn:"atayen",
    }
    
    var configTarget = {
        mongoUser:"",
        mongoPass:"",
        mongoHost:"",
        mongoPort:"",
        mongoBase:"nodesatt"
    }
    
    
    var urlSource = "mongodb://" + configSource.mongoUser + ":" + configSource.mongoPass + "@" + configSource.mongoHost + ":" + configSource.mongoPort + "/" + configSource.mongoBase;
    var urlTarget = "mongodb://" + configTarget.mongoUser + ":" + configTarget.mongoPass + "@" + configTarget.mongoHost + ":" + configTarget.mongoPort + "/" + configTarget.mongoBase;
    
    console.log("source",urlSource)
    console.log("target",urlTarget)
    
    var dbSource = await mongoClient.connect(urlSource, {useNewUrlParser: true,useUnifiedTopology: true}).catch(console.log)
        
    var dbTarget = await mongoClient.connect(urlTarget, {useNewUrlParser: true,useUnifiedTopology: true}).catch(console.log)
    
    console.log("migrate collection user")
        
    
    var wallets = await dbSource.db(configSource.mongoBase).collection("wallet").find().toArray()
    
    for(var i = 0;i<wallets.length;i++) {
        var wallet = wallets[i];
        var user = await dbSource.db(configSource.mongoBaseAtn).collection("sn_user").findOne({_id:wallet.UserId});
        if(user)
            await dbTarget.db(configTarget.mongoBase).collection("user").insertOne(user);
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
    
    var sourceOpts = '--host="'+ configSource.mongoHost + ":" + configSource.mongoPort +'"  --username '+configSource.mongoUser+' --password '+configSource.mongoPass
    var targetOpts = '--host="'+ configTarget.mongoHost + ":" + configTarget.mongoPort +'" --db='+configTarget.mongoBase+' --username '+configTarget.mongoUser+' --password '+configTarget.mongoPass
    
    console.log("migrate collection campaigns")
    
    
    
    child.execSync('mongodump '+sourceOpts+' --db='+configSource.mongoBaseAtn+' -c=campaigns ');
    child.execSync('mongorestore '+targetOpts+' dump/'+configSource.mongoBaseAtn+'/campaigns.bson');
    
    console.log("migrate collection interests")
    
    child.execSync('mongodump '+sourceOpts+' --db='+configSource.mongoBase+' -c=interests ');
    child.execSync('mongorestore '+targetOpts+' dump/'+configSource.mongoBase+'/interests.bson');
    
    console.log("migrate collection notification")
    
    child.execSync('mongodump '+sourceOpts+' --db='+configSource.mongoBaseAtn+' -c=notification ');
    child.execSync('mongorestore '+targetOpts+' dump/'+configSource.mongoBaseAtn+'/notification.bson');
    
    console.log("migrate collection campaign_link")
    
    child.execSync('mongodump '+sourceOpts+' --db='+configSource.mongoBaseAtn+' -c=campaign_link ');
    child.execSync('mongorestore '+targetOpts+' dump/'+configSource.mongoBaseAtn+'/campaign_link.bson');
    
    console.log("migrate collection captcha")
    
    //child.execSync('mongodump '+sourceOpts+' --db='+configSource.mongoBaseAtn+' -c=captcha ');
    //child.execSync('mongorestore '+targetOpts+' dump/'+configSource.mongoBaseAtn+'/captcha.bson');
    
    console.log("migrate collection wallet")
    
    child.execSync('mongodump '+sourceOpts+' --db='+configSource.mongoBase+' -c=wallet ');
    child.execSync('mongorestore '+targetOpts+' dump/'+configSource.mongoBase+'/wallet.bson');
    
    console.log("migrate collection google_profile")
    
    child.execSync('mongodump '+sourceOpts+' --db='+configSource.mongoBase+' -c=google_profile ');
    child.execSync('mongorestore '+targetOpts+' dump/'+configSource.mongoBase+'/google_profile.bson');
    
    console.log("migrate collection fb_profile")
    
    child.execSync('mongodump '+sourceOpts+' --db='+configSource.mongoBase+' -c=fb_profile ');
    child.execSync('mongorestore '+targetOpts+' dump/'+configSource.mongoBase+'/fb_profile.bson');
    
    console.log("migrate collection linkedin_profile")
    
    child.execSync('mongodump '+sourceOpts+' --db='+configSource.mongoBase+' -c=linkedin_profile ');
    child.execSync('mongorestore '+targetOpts+' dump/'+configSource.mongoBase+'/linkedin_profile.bson');
    
    console.log("migrate collection twitter_profile")
    
    child.execSync('mongodump '+sourceOpts+' --db='+configSource.mongoBase+' -c=twitter_profile ');
    child.execSync('mongorestore '+targetOpts+' dump/'+configSource.mongoBase+'/twitter_profile.bson');
    
    console.log("migrate collection fb_page")
    
    child.execSync('mongodump '+sourceOpts+' --db='+configSource.mongoBase+' -c=fb_page ');
    child.execSync('mongorestore '+targetOpts+' dump/'+configSource.mongoBase+'/fb_page.bson');
    
    console.log("migrate collection custom_token")
    
    child.execSync('mongodump '+sourceOpts+' --db='+configSource.mongoBase+' -c=custom_token ');
    child.execSync('mongorestore '+targetOpts+' dump/'+configSource.mongoBase+'/custom_token.bson');
    
    console.log("migrate collection event")
    
    child.execSync('mongodump '+sourceOpts+' --db='+configSource.mongoBase+' -c=event ');
    child.execSync('mongorestore '+targetOpts+' dump/'+configSource.mongoBase+'/event.bson');
    
    console.log("migrate collection wallet_user_node")
    
    child.execSync('mongodump '+sourceOpts+' --db='+configSource.mongoBaseAtn+' -c=wallet_user_node ');
    child.execSync('mongorestore '+targetOpts+' dump/'+configSource.mongoBaseAtn+'/wallet_user_node.bson');
    
    
    
    console.log("migrate collection campaign_kit")
    
    child.execSync('mongodump '+sourceOpts+' --db='+configSource.mongoBaseAtn+' -c=campaign_kit.files ');
    child.execSync('mongorestore '+targetOpts+' dump/'+configSource.mongoBaseAtn+'/campaign_kit.files.bson');
    
    child.execSync('mongodump '+sourceOpts+' --db='+configSource.mongoBaseAtn+' -c=campaign_kit.chunks ');
    child.execSync('mongorestore '+targetOpts+' dump/'+configSource.mongoBaseAtn+'/campaign_kit.chunks.bson')
    
    
    console.log("migrate collection user_file")
    
    child.execSync('mongodump '+sourceOpts+' --db='+configSource.mongoBaseAtn+' -c=user_file.files ');
    child.execSync('mongorestore '+targetOpts+' dump/'+configSource.mongoBaseAtn+'/user_file.files.bson');
    
    child.execSync('mongodump '+sourceOpts+' --db='+configSource.mongoBaseAtn+' -c=user_file.chunks ');
    child.execSync('mongorestore '+targetOpts+' dump/'+configSource.mongoBaseAtn+'/user_file.chunks.bson');
    
    console.log("migrate collection user_legal")
    
    child.execSync('mongodump '+sourceOpts+' --db='+configSource.mongoBaseAtn+' -c=user_legal.files ');
    child.execSync('mongorestore '+targetOpts+' dump/'+configSource.mongoBaseAtn+'/user_legal.files.bson');
    
    child.execSync('mongodump '+sourceOpts+' --db='+configSource.mongoBaseAtn+' -c=user_legal.chunks ');
    child.execSync('mongorestore '+targetOpts+' dump/'+configSource.mongoBaseAtn+'/user_legal.chunks.bson');
    
    console.log("migrate end")
    
    
    })()
    
    
    
