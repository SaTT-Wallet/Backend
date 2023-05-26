const handleEndpointNotFound = (req, res) => {
    res.status(404).format({
        json() {
            res.json({error: 'Not found'})
        },
        default() {
            res.type('txt').send('Not found')
        }
    })
}


const errorHandler = (err, req, res, next) => {
    if(err) {
        const status = err.status || 500;
        const message = err.message || 'An error occurred during the request.'
        const name = err.name || 'Error'
        const body = {
            name, 
            message,
            status
        } 
        
        // render the error page
        res.status(status).json(body);
        
    } else next();
}



module.exports = {errorHandler, handleEndpointNotFound};