const mongoose = require('mongoose');

const pdfSchema = new mongoose.Schema({
  filename: String,
  originalName: String,
  data: Buffer,        // Binary data
  contentType: String,
  size: Number,
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Pdf', pdfSchema);
