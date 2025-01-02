const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const realEstateAnalysisSchema = new Schema({ 
    totalInvestedAmountOfRealEstate: {
        type: Number,
    },
    currentReturnAmountOfRealEstate: {
        type: Number,
    },
    totalProfitGainedOfRealEstate: {  
        type: Number,
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'userModel',
    },
}, { timestamps: true });

const RealEstateAnalysisModel = mongoose.model("RealEstateAnalysis", realEstateAnalysisSchema);
module.exports = RealEstateAnalysisModel;
