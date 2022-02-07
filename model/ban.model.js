const mongoose = require('mongoose');

const banSchema = mongoose.Schema({

    id: { type: String},
    idCampaign: { type: String},
   idProm: { type: String},
   date: { type: Number},
   admin: { type: Boolean},
   
})

const Ban = mongoose.model("oracleban", banSchema);