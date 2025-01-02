import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const AreaPriceSchema = new Schema(
  {
    cityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "City",
    },
    stateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "State",
    },
    areaName: {
      type: String,
      required: true,
    },
    pricePerSquareFoot: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);

const AreaPriceModel = mongoose.model("AreaPrice", AreaPriceSchema);
export default AreaPriceModel;
