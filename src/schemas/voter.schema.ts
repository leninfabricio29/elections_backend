import { Schema, model } from 'mongoose';

const VoterSchema = new Schema({
  election: { type: Schema.Types.ObjectId, ref: 'Election', required: true },
  cedula: { type: String, required: true },
  face_url: { type: String, required: true },
  hasVoted: { type: Boolean, default: false },
}, { timestamps: true });

export default model('Voter', VoterSchema);
