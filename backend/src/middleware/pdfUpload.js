// src/controllers/pdfController.js
import mongoose from 'mongoose';
import Pdf from '../models/Pdf.js'; // if you have a model
import { Readable } from 'stream';

export const uploadPdf = async (req, res) => {
  try {
    const { originalname, mimetype, buffer } = req.file;

    const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
      bucketName: 'pdfs',
    });

    const readableStream = new Readable();
    readableStream.push(buffer);
    readableStream.push(null); // End of stream

    const uploadStream = bucket.openUploadStream(originalname, {
      contentType: mimetype,
      metadata: {
        uploadedBy: req.admin.id,
        originalName: originalname,
      },
    });

    readableStream.pipe(uploadStream);

    uploadStream.on('error', (err) => {
      res.status(500).json({ message: 'Upload failed', error: err.message });
    });

    uploadStream.on('finish', () => {
      res.status(201).json({
        message: 'PDF uploaded successfully',
        fileId: uploadStream.id,
      });
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to upload PDF', error: err.message });
  }
};
