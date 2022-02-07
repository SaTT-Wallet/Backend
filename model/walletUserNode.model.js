const mongoose = require('mongoose');

const walletUserSchema = mongoose.Schema({

    idUser:{ type: Number, required: true,  ref: 'sn_users' },
    wallet: { type: String},
   
})

const WalletUserNode = mongoose.model("wallet_user_node", walletUserSchema);