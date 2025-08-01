import { Schema, model } from 'mongoose';

const ElectionSchema = new Schema({
  name: { type: String, required: true },
  description: String,
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  qr_code: { type: String, required: true }, // URL del código QR
  isByParty: { type: Boolean, default: false },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

export default model('Election', ElectionSchema);
