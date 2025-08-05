
import mongoose from 'mongoose';

const logoSchema = new mongoose.Schema({
  filename: String,
  path: String,
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Logo', logoSchema);
