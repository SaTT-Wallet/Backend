module.exports = async function (app) {
	
	var ioManager = {};
	var fs = require('fs');
	var https = require('https');
	
	var httpServer = https.createServer({
	  key: fs.readFileSync(app.config.SSLKeyFile,'utf8'),
	  cert: fs.readFileSync(app.config.SSLCertFile,'utf8')
	}, app);
	
	var io = require('socket.io')(httpServer);
	
	
	io.on('connection', function(socket){
		socket.on('subscribe', function(hash) {
			console.log('subscribe hash ', hash);
			socket.join(hash);
		});
	});

	httpServer.listen(app.config.listenPort, function(){
	  console.log('io listening on *:'+app.config.listenPort);
	});
	
	ioManager.confirm = function(hash,numConfirm) {
		io.to(hash).emit('confirmation',{num :numConfirm,hash:hash });
	}
	
	ioManager.SocketIo=io
	app.io = ioManager;
	
	
	app.https = https;
	
	return app;
	
}
