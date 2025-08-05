import mongoose from 'mongoose';

const videoSchema = new mongoose.Schema({
  type : { type: String, enum: ['intro', 'case'], required: true, unique: true },
  url  : { type: String, required: true }
});

export default mongoose.model('Video', videoSchema);