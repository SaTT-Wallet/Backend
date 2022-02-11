const mongoose = require('mongoose')
const db = mongoose.createConnection(process.env.MONGOURI)

const notificationSchema = mongoose.Schema(
    {
        idNode: { type: String },
        type: { type: String },
        status: { type: String },
        label: {
            cmp_name: { type: String },
            cmp_hash: { type: String },
            linkHash: { type: String },
        },
        isSeen: { type: Boolean },
        isSend: { type: Boolean },
        attachedEls: {
            id: { type: Number },
        },
    },
    { timestamps: true, collection: 'notification' }
)

const Notification = db.model('notification', notificationSchema)
module.exports = Notification
