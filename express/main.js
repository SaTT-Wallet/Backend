module.exports = function (app) {
	
	app.get('/', function(req, res) {
		res.setHeader('Content-Type', 'text/plain');
		res.end('/');
	})
	.options("/*", function(req, res, next){
	  res.header('Access-Control-Allow-Origin', '*');
	  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
	  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With, ATN-Node');
	  res.sendStatus(200);
	})
	.use(function(req, res, next){
		
  
		res.setHeader('Content-Type', 'text/plain');
		res.status(404).send('Page introuvable !');
	})
	//.listen(app.config.listenPort);
	console.log('server ready');
	return app;
}