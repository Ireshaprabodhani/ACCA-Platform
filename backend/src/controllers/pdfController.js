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

// Upload (your existing code)
exports.uploadPdf = async (req, res) => {
  const { file } = req;
  if (!file) return res.status(400).json({ message: 'No file uploaded' });

  try {
    // For small files (<1MB), store directly
    if (file.size <= 1000000) {
      const pdf = new Pdf({
        filename: file.filename,
        originalName: file.originalname,
        data: fs.readFileSync(file.path),
        contentType: file.mimetype,
        size: file.size,
        storageType: 'embedded',
        uploadedBy: req.admin._id
      });
      await pdf.save();
      fs.unlinkSync(file.path);
      return res.status(201).json(pdf);
    }
        
    // For large files, use GridFS
    const readStream = fs.createReadStream(file.path);
    const uploadStream = gfs.openUploadStream(file.filename, {
      metadata: {
        originalName: file.originalname,
        uploadedBy: req.admin._id
      },
      contentType: file.mimetype
    });
        
    readStream.pipe(uploadStream);
        
    uploadStream.on('error', () => {
      throw new Error('Upload failed');
    });
        
    uploadStream.on('finish', async () => {
      fs.unlinkSync(file.path);
      const pdf = new Pdf({
        filename: file.filename,
        originalName: file.originalname,
        size: file.size,
        contentType: file.mimetype,
        storageType: 'gridfs',
        fileId: uploadStream.id,
        uploadedBy: req.admin._id
      });
      await pdf.save();
      res.status(201).json(pdf);
    });
  } catch (err) {
    res.status(500).json({ message: 'Upload failed', error: err.message });
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
    console.log('Attempting to view PDF with ID:', id);
    
    const pdf = await Pdf.findById(id);
    if (!pdf) {
      console.log('PDF not found in database');
      return res.status(404).json({ message: 'PDF not found' });
    }

    console.log('PDF found:', {
      originalName: pdf.originalName,
      storageType: pdf.storageType,
      size: pdf.size
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${pdf.originalName}"`);

    if (pdf.storageType === 'embedded') {
      console.log('Serving embedded PDF');
      res.send(pdf.data);
    } else if (pdf.storageType === 'gridfs') {
      console.log('Serving GridFS PDF');
      const downloadStream = gfs.openDownloadStream(pdf.fileId);
      
      downloadStream.on('error', (error) => {
        console.error('GridFS download error:', error);
        res.status(404).json({ message: 'File not found in GridFS' });
      });
      
      downloadStream.pipe(res);
    } else {
      // Fallback for file system storage
      console.log('Serving filesystem PDF');
      const filePath = path.join(__dirname, '../uploads/pdfs/', pdf.filename);
      
      if (!fs.existsSync(filePath)) {
        console.log('File not found on filesystem:', filePath);
        return res.status(404).json({ message: 'File not found on filesystem' });
      }
      
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);
    }
  } catch (err) {
    console.error('Error in viewPdf:', err);
    res.status(500).json({ message: 'Error retrieving PDF', error: err.message });
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