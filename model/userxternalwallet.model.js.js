const mongoose = require('mongoose');
const { mongoConnection } = require('../conf/config');

const db = mongoose.createConnection(mongoConnection(), {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true,
  useFindAndModify: false,
});

const userExternalWalletSchema = new mongoose.Schema({
  _id: {
    type: String,
    required: true,
  },
  balance: {
    type: Number,
    default: 0,
  },
});

const UserExternalWallet = db.model('UserExternalWallet', userExternalWalletSchema);

module.exports = UserExternalWallet;