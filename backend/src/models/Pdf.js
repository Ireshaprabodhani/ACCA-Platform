const mongoose = require('mongoose');

const pdfSchema = new mongoose.Schema({
  filename: String,              // Required
  originalName: String,          // Required
  size: Number,                  // ✅ Add this
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',               // ✅ Add this if you're linking to admins
  },
  createdAt: {
    type: Date,
    default: Date.now,          // ✅ Use createdAt instead of uploadedAt
  },
});

module.exports = mongoose.model('Pdf', pdfSchema);
