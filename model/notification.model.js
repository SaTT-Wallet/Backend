const mongoose = require('mongoose')

const notificationSchema = mongoose.Schema(
    {
        idNode: { type: String },
        type: { type: String },
        status: { type: String },
        label: {
            // type: { type: String },
            //     cmp_name: { type: String },
            //     cmp_hash: { type: String },
            //     linkHash: { type: String },
        },
        isSeen: { type: Boolean },
        isSend: { type: Boolean },
        attachedEls: {
            id: { type: Number },
        },
    },
    { timestamps: true, collection: 'notification' }
)

const Notification = mongoose.model('notification', notificationSchema)
module.exports = Notification
