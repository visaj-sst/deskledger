import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const StateSchema = new Schema({
   state: {
        type: String,
        required: true
}
}, { timestamps: true });

const StateModel = mongoose.model('State', StateSchema);
export default StateModel;
