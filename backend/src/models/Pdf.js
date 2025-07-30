const mongoose = require('mongoose');

const PdfSchema = new mongoose.Schema({
  identifier: {
    type: String,
    required: true,
    unique: true  // optional but recommended if each identifier is unique
  },
  filename: {
    type: String,
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  path: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    required: true
  },
  title: {
    type: String,
    required: false
  },
  description: {
    type: String,
    required: false
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Pdf', PdfSchema);
