import { Schema, model } from 'mongoose';

const PartySchema = new Schema({
  election: { type: Schema.Types.ObjectId, ref: 'Election', required: true },
  name: { type: String, required: true },
  description: String,
  logo_url: String,
}, { timestamps: true });

export default model('Party', PartySchema);
