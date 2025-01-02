import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const GoldMasterSchema = new Schema(
  {
    goldRate22KPerGram: {
      type: Number,
    },
    goldRate24KPerGram: {
      type: Number,
    },
  },
  { timestamps: true }
);

const GoldMasterModel = mongoose.model("GoldMaster", GoldMasterSchema);
export default GoldMasterModel;
