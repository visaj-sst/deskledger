//goldModel.js

const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const goldSchema = new Schema(
  {
    goldId: {
      type: String,
    },
    srNo: {
      type: Number,
    },
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    goldWeight: {
      type: Number,
      required: true,
    },
    goldPurchasePrice: {
      type: Number,
      required: true,
    },
    formOfGold: {
      type: String,
      required: true,
    },
    purityOfGold: {
      type: Number,
      required: true,
    },
    totalReturnAmount: {
      type: Number,
    },
    profit: {
      type: Number,
    },
    sector: {
      type: String,
      default: "Gold",
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "userModel",
    },
  },
  { timestamps: true }
);

const GoldModel = mongoose.model("Gold", goldSchema);
module.exports = GoldModel;
