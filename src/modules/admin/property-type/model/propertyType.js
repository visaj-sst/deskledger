const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const PropertyTypeSchema = new Schema({
    propertyType: {
        type: String,
    }
    
}, { timestamps: true });

const PropertyTypeModel = mongoose.model('PropertyType', PropertyTypeSchema);
module.exports = PropertyTypeModel;
