const mongoose = require('mongoose');

const rateSchema = mongoose.Schema({

    price: { type: Number},
    symbol: { type: String},
   date: { type: Number},
   
})

const Rate = mongoose.model("rate", rateSchema);