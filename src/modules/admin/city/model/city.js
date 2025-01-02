// city.js
const mongoose = require('mongoose');

const CitySchema = new mongoose.Schema({
    city: {
        type: String
    },
    stateId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'State'
    }
});

module.exports = mongoose.model('City', CitySchema);


