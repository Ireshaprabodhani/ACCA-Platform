const mongoose = require('mongoose');

const videoSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['intro', 'case'],
    required: true
  },
  language: {
    type: String,
    enum: ['en', 'si'],
    required: true
  },
  url: { type: String, required: true }
}, { timestamps: true });

videoSchema.index({ type: 1, language: 1 }, { unique: true });

module.exports = mongoose.model('Video', videoSchema);
