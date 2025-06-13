const mongoose = require('mongoose');

const videoSchema = new mongoose.Schema({
  type : { type: String, enum: ['intro', 'case'], required: true, unique: true },
  url  : { type: String, required: true }
});

module.exports = mongoose.model('Video', videoSchema);