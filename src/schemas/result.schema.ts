import { Schema, model } from 'mongoose';

const ElectionResultSchema = new Schema({
  election: { type: Schema.Types.ObjectId, ref: 'Election', required: true },
  results: [{
    candidate: { type: Schema.Types.ObjectId, ref: 'Candidate' },
    voteCount: { type: Number, default: 0 }
  }],
}, { timestamps: true });

export default model('ElectionResult', ElectionResultSchema);
