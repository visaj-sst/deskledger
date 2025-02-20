import mongoose from "mongoose";
import { Schema } from "mongoose";

const StockSchema = new Schema(
  {
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
    stockSymbol: {
      type: String,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
    },
    totalInvestedAmount: {
      type: Number,
      required: true,
    },
    totalReturnAmount: {
      type: Number,
    },
    buyPrice: {
      type: Number,
    },
    buyDate: {
      type: Date,
    },
    sellPrice: {
      type: Number,
    },
    sellDate: {
      type: Date,
    },
    realizedProfitLoss: {
      type: Number,
      default: 0,
    },
    unrealizedProfitLoss: {
      type: Number,
      default: 0,
    },
    sector: {
      type: String,
      default: "Stock Market",
    },
  },
  { timestamps: true }
);
const StockModel = mongoose.model("Stock", StockSchema);
export default StockModel;
