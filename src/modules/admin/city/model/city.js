// city.js
import mongoose from 'mongoose';

const CitySchema = new mongoose.Schema({
    city: {
        type: String
    },
    stateId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'State'
    }
});

export default mongoose.model('City', CitySchema);


