const mongoose = require('mongoose');

const notificationSchema = mongoose.Schema({
    idNode: {type:String},
   type: {type:String},
   status: {type:String},
   label: {
     cmp_name: {type:String},
     cmp_hash: {type:String},
     linkHash: {type:String},
  },
   isSeen:{type:Boolean},
   isSend:{type:Boolean},
   attachedEls: {
     id: {type:Number},
  },
},{timestamps:true})

const Notification = mongoose.model("notification", notificationSchema);


  