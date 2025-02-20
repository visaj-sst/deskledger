import mongoose from "mongoose";
import { Schema } from "mongoose";

const TransactionSchema = new Schema(
  {
    // userId: {
    //   type: Schema.Types.ObjectId,
    //   ref: "UserModel",
    //   default: null,
    // },

    firstName: {
      type: String,
    },

    lastName: {
      type: String,
    },

    srNo: {
      type: Number,
    },
    stockSymbol: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["buy", "sell"],
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    transactionDate: {
      type: Date,
      default: Date.now,
      required: true,
    },
  },
  { timestamps: true }
);
const TransactionModel = mongoose.model("Transaction", TransactionSchema);
export default TransactionModel;
