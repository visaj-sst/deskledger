//fixedDeposit.js

const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const FixedDepositSchema = new Schema(
  {
    fdId: {
      type: String,
    },
    srNo: {
      type: Number,
    },
    firstName: {
      type: String,
      trim: true,
    },
    lastName: {
      type: String,
      trim: true,
    },
    fdNo: {
      type: Number,
      unique: true,
    },
    fdType: {
      type: String,
    },
    bankId: {
      type: Schema.Types.ObjectId,
      ref: "bank",
    },
    branchName: {
      type: String,
    },
    interestRate: {
      type: Number,
    },
    startDate: {
      type: Date,
    },
    maturityDate: {
      type: Date,
    },
    totalInvestedAmount: {
      type: Number,
    },
    tenureInYears: {
      type: Number,
    },
    tenureInMonths: {
      type: Number,
    },
    currentReturnAmount: {
      type: Number,
    },
    totalReturnedAmount: {
      type: Number,
    },
    currentProfitAmount: {
      type: Number,
    },
    totalYears: {
      type: String,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "UserModel",
    },
    sector: {
      type: String,
      default: "Banking", // Default value if all FixedDeposits are in the Banking sector
    },
  },
  { timestamps: true }
);

const FixedDepositModel = mongoose.model("FixedDeposit", FixedDepositSchema);
module.exports = FixedDepositModel;
