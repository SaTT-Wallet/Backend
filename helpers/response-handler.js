class responseHandler {
    constructor() { }

    makeResponse = (res, status, code, msg, result) => {
		return res.status(code).send({
			status,
			code,
			msg,
			result: result
		});
     }
}

module.exports.responseHandler = new responseHandler();

