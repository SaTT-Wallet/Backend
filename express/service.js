module.exports = function (app) {
	
	
	app.get('/youtube/:id',async function(req, response) {
		var id = req.params.id;
		var res = await app.oracle.youtube(id);
		response.end(JSON.stringify(res));
		
	})
	app.get('/facebook', async function(req, response) {
		var url = req.query.url;
		var parts = url.split('/');
		var pageName = parts[3];
		var idPost = parts[5];
		
		var res = await app.oracle.facebook(pageName,idPost)
		response.end(JSON.stringify(res));		
	})
	app.get('/instagram/:id', async function(req, response) {
		var res = await app.oracle.instagram(req.params.id);
		response.end(JSON.stringify(res));
	})
	app.get('/twitter/:user/:id', async function(req, response) {
		var res = await app.oracle.twitter(req.params.user,req.params.id);
		response.end(JSON.stringify(res));
		
	})
	
	app.get('/notary', function(req, response) {		
			
	})
	app.get('/', function(req, response) {
			 response.render('index');
	})
	
	
	return app;


}