import Pdf from '../models/Pdf.js';
import path from 'path';
import fs from 'fs';
import mongoose from 'mongoose';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize GridFS
let gfs;
const conn = mongoose.connection;
conn.once('open', () => {
  gfs = new mongoose.mongo.GridFSBucket(conn.db, { bucketName: 'uploads' });
  global.gfs = gfs; // optionally make global
});

export const uploadPdf = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { originalname, buffer } = req.file;
    const stream = gfs.openUploadStream(originalname);
    stream.end(buffer);

    stream.on('finish', () => {
      res.status(200).json({ message: 'PDF uploaded successfully', fileId: stream.id });
    });

    stream.on('error', (err) => {
      res.status(500).json({ error: 'Failed to upload PDF', details: err.message });
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


export const listPdfs = async (req, res) => {
  try {
    const files = await mongoose.connection.db
      .collection('pdfs.files') // GridFS file metadata collection
      .find({})
      .sort({ uploadDate: -1 })
      .toArray();

    const formatted = files.map(file => ({
      _id: file._id,
      filename: file.filename,
      length: file.length,
      uploadedAt: file.uploadDate,
    }));

    res.json(formatted);
  } catch (err) {
    console.error('Error listing PDFs:', err);
    res.status(500).json({ message: 'Failed to fetch PDFs', error: err.message });
  }
};


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

export const viewPdf = async (req, res) => {
  const { id } = req.params;

  try {
    const pdf = await Pdf.findById(id);
    if (!pdf) return res.status(404).json({ message: 'PDF not found' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${pdf.originalName}"`);
    res.setHeader('Cache-Control', 'no-cache');

    if (pdf.storageType === 'embedded') {
      if (!pdf.data) return res.status(404).json({ message: 'Embedded PDF data not found' });
      return res.send(pdf.data);
    }

    if (pdf.storageType === 'gridfs') {
      if (!gfs || !pdf.fileId) return res.status(500).json({ message: 'GridFS error or missing fileId' });
      const downloadStream = gfs.openDownloadStream(pdf.fileId);
      downloadStream.on('error', () => {
        res.status(404).json({ message: 'File not found in GridFS' });
      });
      return downloadStream.pipe(res);
    }

    res.status(400).json({ message: 'Invalid or unsupported storage type' });

  } catch (err) {
    res.status(500).json({ message: 'Error retrieving PDF', error: err.message });
  }
};

export const deletePdf = async (req, res) => {
  const { id } = req.params;

  try {
    const pdf = await Pdf.findById(id);
    if (!pdf) return res.status(404).json({ message: 'PDF not found' });

    if (pdf.storageType === 'gridfs' && pdf.fileId) {
      await gfs.delete(pdf.fileId);
    } else if (pdf.storageType === 'filesystem') {
      const filePath = path.join(__dirname, '../uploads/pdfs/', pdf.filename);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    await Pdf.findByIdAndDelete(id);
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Delete failed', error: err.message });
  }
};

export const downloadPdf = async (req, res) => {
  const { id } = req.params;

  try {
    const pdf = await Pdf.findById(id);
    if (!pdf) return res.status(404).json({ message: 'PDF not found' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${pdf.originalName}"`);

    if (pdf.storageType === 'embedded') {
      res.send(pdf.data);
    } else if (pdf.storageType === 'gridfs') {
      const downloadStream = gfs.openDownloadStream(pdf.fileId);
      downloadStream.on('error', () => {
        res.status(404).json({ message: 'File not found in GridFS' });
      });
      downloadStream.pipe(res);
    } else {
      const filePath = path.join(__dirname, '../uploads/pdfs/', pdf.filename);
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ message: 'File not found' });
      }
      res.download(filePath, pdf.originalName);
    }
  } catch (err) {
    res.status(500).json({ message: 'Error downloading PDF', error: err.message });
  }
};

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
