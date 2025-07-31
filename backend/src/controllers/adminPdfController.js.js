const Pdf = require('../models/Pdf');
const fs = require('fs');
const path = require('path');

// Configure upload directory
const uploadDir = path.join(__dirname, '../uploads/pdfs');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

exports.uploadPdf = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // No identifier needed here
    const { originalname, filename, path: filePath, size } = req.file;

    const pdf = new Pdf({
      filename,
      originalName: originalname,
      path: filePath,
      size,
      uploadedBy: req.admin ? req.admin._id : null,  // Use req.admin._id from middleware
    });

    await pdf.save();
    res.status(201).json(pdf);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


exports.listPdfs = async (req, res) => {
  try {
    console.log('Attempting to fetch PDFs...'); // Debug log
    const pdfs = await Pdf.find().sort({ createdAt: -1 });
    console.log(`Found ${pdfs.length} PDFs`); // Debug log
    res.json(pdfs);
  } catch (error) {
    console.error('Error fetching PDFs:', error);
    res.status(500).json({ message: 'Error fetching PDFs' });
  }
};

exports.getPdf = async (req, res) => {
  try {
    const pdf = await Pdf.findById(req.params.id);
    if (!pdf) {
      return res.status(404).json({ message: 'PDF not found' });
    }
    res.json(pdf);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updatePdf = async (req, res) => {
  try {
    const { title, description } = req.body;
    const pdf = await Pdf.findById(req.params.id);
    if (!pdf) {
      return res.status(404).json({ message: 'PDF not found' });
    }

    if (title !== undefined) pdf.title = title;
    if (description !== undefined) pdf.description = description;

    await pdf.save();
    res.json(pdf);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deletePdf = async (req, res) => {
  try {
    const pdf = await Pdf.findById(req.params.id);
    if (!pdf) {
      return res.status(404).json({ message: 'PDF not found' });
    }

    if (fs.existsSync(pdf.path)) {
      fs.unlinkSync(pdf.path);
    }

    await pdf.deleteOne();
    res.json({ message: 'PDF deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.downloadPdf = async (req, res) => {
  try {
    const pdf = await Pdf.findById(req.params.id);
    if (!pdf) {
      return res.status(404).json({ message: 'PDF not found' });
    }

    res.download(pdf.path, pdf.originalName);
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ message: 'Download failed' });
  }
};
