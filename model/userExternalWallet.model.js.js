const mongoose = require('mongoose');
const { mongoConnection } = require('../conf/config');
autoIncrement = require('mongoose-auto-increment')
const db = mongoose.createConnection(mongoConnection(), {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true,
  useFindAndModify: false,
});
autoIncrement.initialize(db)
const userExternalWalletSchema = new mongoose.Schema({
  walletId: {
    type: String,
    required: true,
  },
  balance: {
    type: Number,
    default: 0,
  },
});
userExternalWalletSchema.plugin(autoIncrement.plugin, {
  model: 'UserExternalWallet',
  field: '_id',
  startAt: 100000000,
  incrementBy: 1,
})
const UserExternalWallet = db.model('UserExternalWallet', userExternalWalletSchema);

module.exports = UserExternalWallet;