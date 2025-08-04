const Pdf = require('../models/Pdf');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');

// Initialize GridFS
let gfs;
const conn = mongoose.connection;
conn.once('open', () => {
  gfs = new mongoose.mongo.GridFSBucket(conn.db, { bucketName: 'uploads' });
});


export const uploadPdf = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { originalname, buffer } = req.file;
    const stream = global.gridfsBucket.openUploadStream(originalname);
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


// Admin List
exports.listPdfs = async (req, res) => {
  try {
    const pdfs = await Pdf.find().sort({ uploadedAt: -1 });
    res.json(pdfs);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch PDFs', error: err.message });
  }
};

// Edit PDF metadata
exports.editPdf = async (req, res) => {
  const { id } = req.params;
  const { title, description } = req.body;

  try {
    const pdf = await Pdf.findByIdAndUpdate(
      id, 
      { title, description }, 
      { new: true }
    );
    if (!pdf) return res.status(404).json({ message: 'PDF not found' });
    res.json(pdf);
  } catch (err) {
    res.status(500).json({ message: 'Update failed', error: err.message });
  }
};

// THIS IS THE KEY FUNCTION - View PDF
exports.viewPdf = async (req, res) => {
  const { id } = req.params;

  try {
    console.log('📄 Attempting to view PDF with ID:', id);

    const pdf = await Pdf.findById(id);
    if (!pdf) {
      console.log('❌ PDF not found in database');
      return res.status(404).json({ message: 'PDF not found' });
    }

    const { originalName, storageType, size, fileId, data } = pdf;

    console.log('✅ PDF found:', {
      originalName,
      storageType,
      size
    });

    // Set headers for PDF display
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${originalName}"`);
    res.setHeader('Cache-Control', 'no-cache');

    // ✅ Handle embedded PDF (Base64 or Buffer in MongoDB)
    if (storageType === 'embedded') {
      if (!data) {
        console.warn('⚠️ Embedded PDF data is missing');
        return res.status(404).json({ message: 'Embedded PDF data not found' });
      }
      console.log('📤 Serving embedded PDF');
      return res.send(data);
    }

    // ✅ Handle GridFS PDF
    if (storageType === 'gridfs') {
      if (!global.gfs) {
        console.error('❌ GridFS not initialized');
        return res.status(500).json({ message: 'GridFS is not initialized on server' });
      }

      if (!fileId) {
        console.warn('⚠️ Missing fileId for GridFS storage');
        return res.status(400).json({ message: 'Missing fileId for GridFS storage' });
      }

      console.log('📤 Serving GridFS PDF:', fileId.toString());

      const downloadStream = global.gfs.openDownloadStream(fileId);

      downloadStream.on('file', (file) => {
        console.log('📁 GridFS file info:', file.filename, file.length);
      });

      downloadStream.on('error', (error) => {
        console.error('❌ GridFS download error:', error);
        if (!res.headersSent) {
          res.status(404).json({ message: 'File not found in GridFS' });
        }
      });

      return downloadStream.pipe(res);
    }

    // ❌ Unknown storage type
    console.error('❌ Unknown or unsupported storage type:', storageType);
    return res.status(400).json({ message: 'Invalid or unsupported storage type' });

  } catch (err) {
    console.error('❌ Error in viewPdf:', err);
    if (!res.headersSent) {
      res.status(500).json({ message: 'Error retrieving PDF', error: err.message });
    }
  }
};


// Delete PDF
exports.deletePdf = async (req, res) => {
  const { id } = req.params;

  try {
    const pdf = await Pdf.findById(id);
    if (!pdf) return res.status(404).json({ message: 'PDF not found' });

    // Delete based on storage type
    if (pdf.storageType === 'gridfs') {
      await gfs.delete(pdf.fileId);
    } else if (pdf.storageType === 'filesystem') {
      const filePath = path.join(__dirname, '../uploads/pdfs/', pdf.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await Pdf.findByIdAndDelete(id);
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Delete failed', error: err.message });
  }
};

// Download PDF
exports.downloadPdf = async (req, res) => {
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

// User view
exports.getAllForUser = async (req, res) => {
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