//bank.js

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const BankSchema = new Schema({
    bankName: {
        type: String,
        required: true
        }
}, { timestamps: true });

const BankModel = mongoose.model('Bank', BankSchema);
module.exports = BankModel;
