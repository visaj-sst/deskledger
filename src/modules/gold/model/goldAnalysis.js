import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const goldAnalysisSchema = new Schema(
  {
    totalInvestedAmountOfGold: {
      type: Number,
    },
    currentReturnAmountOfGold: {
      type: Number,
    },
    totalProfitGainedOfGold: {
      type: Number,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "userModel",
    },
  },
  { timestamps: true }
);

const GoldAnalysisModel = mongoose.model("GoldAnalysis", goldAnalysisSchema);
export default GoldAnalysisModel;
