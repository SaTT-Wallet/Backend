const verifySignature = require('./../web3/verifySignature')

const verifySignatureMiddleware = (req, res, next) => {
    const signature = req.header('X-Signature');
    const address = req.header('X-Address');
    const message = req.header('X-Message')
    if (verifySignature(message, signature, address)) {
        req.address = address;
        return next();
    } else {
        return res.status(401).json({ message: 'Invalid signature' });
    }
}

module.exports = verifySignatureMiddleware