const { statusCode, message } = require("../../../utils/api.response.js");
import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const FdAnalysisSchema = new Schema(
  {
    totalInvestedAmountOfFds: {
      type: Number,
      required: true,
    },
    currentReturnAmountOfFds: {
      type: Number,
      required: true,
    },
    totalProfitGainedOfFds: {
      type: Number,
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("fdAnalysis", FdAnalysisSchema);
