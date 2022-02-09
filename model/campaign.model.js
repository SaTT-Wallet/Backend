const mongoose = require('mongoose')

const campaignSchema = mongoose.Schema({
    id: { type: String },
    blockchainType: { type: String },
    startDate: { type: Number },
    endDate: { type: Number },
    dataUrl: { type: String },
    status: { type: String },
    owner: { type: String },
    contract: { type: String },
})

const Campaign = mongoose.model('campaign', campaignSchema)
