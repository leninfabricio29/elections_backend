import { Schema, model } from 'mongoose';

const VoteSchema = new Schema({
  voter: { type: Schema.Types.ObjectId, ref: 'Voter', required: true },
  election: { type: Schema.Types.ObjectId, ref: 'Election', required: true },
  candidate: { type: Schema.Types.ObjectId, ref: 'Candidate', required: true },
  timestamp: { type: Date, default: Date.now },
});

export default model('Vote', VoteSchema);
