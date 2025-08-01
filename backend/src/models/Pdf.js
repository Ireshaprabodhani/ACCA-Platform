const mongoose = require('mongoose');

const pdfSchema = new mongoose.Schema({
  filename: String,
  originalName: String,
  uploadedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Pdf', pdfSchema);
