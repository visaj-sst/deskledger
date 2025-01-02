//realestate.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const RealEstateSchema = new Schema({
    propertyId: {
        type: String,
    },
    srNo: {
        type: Number
    },
    firstName: {
        type: String,
        trim: true,
        required: true
    },
    lastName: {
        type: String,
        trim: true,
        required: true
    },
    propertyTypeId: { // e.g., Residential, Commercial, Land
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PropertyType'
    },
    subPropertyTypeId: { // e.g., Office, Showroom, Flat, Apartment, Villa
         type: mongoose.Schema.Types.ObjectId,
        ref: 'SubPropertyType'
    },
    propertyName: {     // e.g., Name of the building, society, etc.
        type: String, 
    },
    propertyAddress: {
        type: String, // Full address of the property
        required: true
    },
    cityId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'City'
    },
    stateId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'State' 
    },
    areaName: {
        type: String, // Add the area name field
        required: true
    },
    areaInSquareFeet: {
        type: Number, // Area of the property in square feet
        required: true
    },
    purchasePrice: {
        type: Number, // Original purchase price
        required: true
    },
    currentValue: {
        type: Number, // Current calculated value (based on current price per square foot)
    },
    profit: {
        type: Number, // Profit calculated based on the current value and purchase price
    },
    sector: {
        type: String,
        default: 'Real Estate' // Default sector value for real estate
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'UserModel', // Reference to the user who owns this property
    }
}, { timestamps: true });

const RealEstateModel = mongoose.model('RealEstate', RealEstateSchema);
module.exports = RealEstateModel;
