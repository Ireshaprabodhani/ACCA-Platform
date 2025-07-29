const mongoose = require('mongoose');

const PdfSchema = new mongoose.Schema({
  identifier: {  // Unique identifier for each PDF (e.g., "course-syllabus")
    type: String,
    required: true,
    unique: true
  },
  filename: {
    type: String,
    required: true
  },
  path: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Pdf', PdfSchema);