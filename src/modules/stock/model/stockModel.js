import mongoose from "mongoose";
import { Schema } from "mongoose";

const StockSchema = new Schema(
  {
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      required: true,
    },
    srNo: {
      type: Number,
    },
    stockSymbol: {
      type: String,
      required: true,
    },
    stockName: {
      type: String,
      required: true,
    },
    purchasePrice: {
      type: Number,
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
    currentPrice: {
      type: Number,
    },
    currentValue: {
      type: Number,
    },
    profitLoss: {
      type: Number,
    },
    buyDate: {
      type: Date,
      default: null,
    },
    sellDate: {
      type: Date,
      default: null,
    },
    sector: {
      type: String,
      default: "Stock Market",
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "UserModel",
    },
  },
  { timestamps: true }
);

const StockModel = mongoose.model("Stock", StockSchema);
export default StockModel;
