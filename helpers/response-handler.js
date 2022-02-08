class responseHandler {
    constructor() { }

    makeResponseData = (res, code,message,data) => {
		return res.status(code).send({
			code,
			message,
			data
		});
     }
	 makeResponseError = (res,code,error) => {
		return res.status(code).send({
			code,
			error
		});
     }
}

module.exports.responseHandler = new responseHandler();

