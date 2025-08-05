import mongoose from 'mongoose';

const pdfSchema = new mongoose.Schema({
  originalName: { type: String, required: true },
  s3Key: { type: String, required: true },      // Key in S3 bucket
  size: Number,
  contentType: String,
  title: String,
  description: String,
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
  uploadedAt: { type: Date, default: Date.now },
});

// Check if model already exists before creating it
const Pdf = mongoose.models.Pdf || mongoose.model('Pdf', pdfSchema);

export default Pdf;