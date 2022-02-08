class responseHandler {
    constructor() { }

    makeResponse = (res, status, code, message, data) => {
		return res.status(code).send({
			status,
			code,
			message,
			data
		});
     }
}

module.exports.responseHandler = new responseHandler();

