const mongoose = require('mongoose');

const txSchema = mongoose.Schema({
    

    type:{ type: String},
    from:  { type: String},
    to: { type: String},
    value: { type: String},
   ethTxHash:{ type: String},
   mintTxHash: { type: String},
   bscTxHash:{ type: String},
   date: { type: Number},
   
})

const Tx = mongoose.model("txs", txSchema);