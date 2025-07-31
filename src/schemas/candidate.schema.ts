import { Schema, model } from 'mongoose';

const CandidateSchema = new Schema({
  election: { type: Schema.Types.ObjectId, ref: 'Election', required: true },
  name: { type: String, required: true },
  description: String, // por ejemplo: Presidente, Tesorero, etc.
  party: { type: Schema.Types.ObjectId, ref: 'Party', default: null },
}, { timestamps: true });

export default model('Candidate', CandidateSchema);
