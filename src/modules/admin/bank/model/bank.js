//bank.js

import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const BankSchema = new Schema({
    bankName: {
        type: String,
        required: true
        }
}, { timestamps: true });

const BankModel = mongoose.model('Bank', BankSchema);
export default BankModel;
