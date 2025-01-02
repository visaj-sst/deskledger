import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const SubPropertyTypeSchema = new Schema({
    subPropertyType: {
        type: String
    },
    propertyTypeId: {
        type: Schema.Types.ObjectId,
        ref: 'PropertyType'
    }
}, { timestamps: true });

const SubPropertyTypeModel = mongoose.model('SubPropertyType', SubPropertyTypeSchema);
export default SubPropertyTypeModel;
