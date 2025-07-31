import { Schema, model } from 'mongoose';

const UserSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // Hasheada
  role: { type: String, enum: ['admin'], default: 'admin' },
}, { timestamps: true });

export default model('User', UserSchema);
