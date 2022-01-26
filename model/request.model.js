const mongoose = require('mongoose');

const requestSchema = mongoose.Schema({

    id: { type: String},
    typeSN: { type: Number},
    idUser: { type: String},
    idPost: { type: String},
    date:{ type: Number},
    likes:{ type: Number, default:0},
    shares: { type: Number, default:0},
    views:{ type: Number, default:0},
    isNew: { type: Boolean},
   
})

const Request = mongoose.model("request", requestSchema);