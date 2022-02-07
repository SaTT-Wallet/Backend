const mongoose = require('mongoose');

const txSchema = mongoose.Schema({

    
    blockHash: { type: String},
    blockNumber: { type: Number},
    from:  { type: String},
    gas: { type: Number},
    gasPrice: { type: Number},
    hash:  { type: String},
    input:  { type: String},
    nonce: { type: Number},
    r:  { type: String},
    s: { type: String},
    to: { type: String},
    transactionIndex: { type: Number},
    type:{ type: Number},
    v:  { type: String},
    value: { type: String},
    txtype:  { type: String},
    apiversion: { type: Number},
    
    networkid:  { type: String},
    from_id:{ type: Number, required: true,  ref: 'sn_users' },
    date: { type: Number},
   
})

const Tx = mongoose.model("txs", txSchema);