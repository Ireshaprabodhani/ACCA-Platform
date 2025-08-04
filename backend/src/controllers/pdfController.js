import Pdf from '../models/Pdf.js';
import s3 from '../utils/s3Client.js';
import { v4 as uuidv4 } from 'uuid';  
import path from 'path';

// Upload PDF to S3 and save metadata
export const uploadPdf = async (req, res) => {
  const file = req.file;
  if (!file) return res.status(400).json({ message: 'No file uploaded' });

  try {
    // Generate unique S3 key for the PDF
    const extension = path.extname(file.originalname); // e.g., ".pdf"
    const s3Key = `pdfs/${uuidv4()}${extension}`;

    const params = {
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: pdf.s3Key,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: 'private',
    };

    await s3.upload(params).promise();

    const pdf = new Pdf({
      originalName: file.originalname,
      s3Key,
      size: file.size,
      contentType: file.mimetype,
      uploadedBy: req.admin._id,
      title: req.body.title || '',
      description: req.body.description || '',
    });

    await pdf.save();

    res.status(201).json(pdf);
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ message: 'Upload failed', error: err.message });
  }
};

// List all PDFs for admin
export const listPdfs = async (req, res) => {
  try {
    const pdfs = await Pdf.find().sort({ uploadedAt: -1 });
    res.json(pdfs);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch PDFs', error: err.message });
  }
};

// Edit PDF metadata
export const editPdf = async (req, res) => {
  const { id } = req.params;
  const { title, description } = req.body;

  try {
    const pdf = await Pdf.findByIdAndUpdate(id, { title, description }, { new: true });
    if (!pdf) return res.status(404).json({ message: 'PDF not found' });
    res.json(pdf);
  } catch (err) {
    res.status(500).json({ message: 'Update failed', error: err.message });
  }
};

// View PDF (inline display)
export const viewPdf = async (req, res) => {
  try {
    const { id } = req.params;
    const pdf = await Pdf.findById(id);
    if (!pdf) return res.status(404).json({ message: 'PDF not found' });

    const params = {
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: pdf.s3Key,
    };

    const stream = s3.getObject(params).createReadStream();

    res.setHeader('Content-Type', pdf.contentType);
    res.setHeader('Content-Disposition', `inline; filename="${pdf.originalName}"`);

    stream.on('error', (err) => {
      console.error('S3 view error:', err);
      res.status(404).json({ message: 'File not found on S3' });
    });

    stream.pipe(res);
  } catch (err) {
    console.error('View error:', err);
    res.status(500).json({ message: 'Error viewing PDF', error: err.message });
  }
};

// Delete PDF (S3 + MongoDB)
export const deletePdf = async (req, res) => {
  try {
    const { id } = req.params;
    const pdf = await Pdf.findById(id);
    if (!pdf) return res.status(404).json({ message: 'PDF not found' });

    const params = {
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: pdf.s3Key,
    };

    await s3.deleteObject(params).promise();
    await Pdf.findByIdAndDelete(id);

    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Delete failed', error: err.message });
  }
};

// Download PDF (force download)
export const downloadPdf = async (req, res) => {
  try {
    const { id } = req.params;
    const pdf = await Pdf.findById(id);
    if (!pdf) return res.status(404).json({ message: 'PDF not found' });

    const params = {
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: pdf.s3Key,
    };

    const stream = s3.getObject(params).createReadStream();

    res.setHeader('Content-Type', pdf.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${pdf.originalName}"`);

    stream.on('error', (err) => {
      console.error('S3 download error:', err);
      res.status(404).json({ message: 'File not found on S3' });
    });

    stream.pipe(res);
  } catch (err) {
    res.status(500).json({ message: 'Error downloading PDF', error: err.message });
  }
};

// User endpoint to get list of PDFs (with URLs)
export const getAllForUser = async (req, res) => {
  try {
    const pdfs = await Pdf.find().sort({ uploadedAt: -1 });
    const response = pdfs.map(pdf => ({
      _id: pdf._id,
      originalName: pdf.originalName,
      title: pdf.title,
      description: pdf.description,
      filename: pdf.filename,
      url: `/api/pdf/view/${pdf._id}`
    }));
    res.json(response);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch PDFs', error: err.message });
  }
};
