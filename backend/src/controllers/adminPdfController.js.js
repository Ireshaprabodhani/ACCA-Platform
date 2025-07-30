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

    const { identifier } = req.body;
    if (!identifier) {
      return res.status(400).json({ message: 'Identifier is required' });
    }

    const { originalname, filename, path: filePath, size } = req.file;

    const existingPdf = await Pdf.findOne({ identifier });
    if (existingPdf) {
      if (fs.existsSync(existingPdf.path)) {
        fs.unlinkSync(existingPdf.path);
      }
      existingPdf.filename = filename;
      existingPdf.originalName = originalname;
      existingPdf.path = filePath;
      existingPdf.size = size;
      await existingPdf.save();
      return res.json(existingPdf);
    }

    const pdf = new Pdf({
      identifier,
      filename,
      originalName: originalname,
      path: filePath,
      size,
      uploadedBy: req.adminId || null,
    });

    await pdf.save();
    res.status(201).json(pdf);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.listPdfs = async (req, res) => {
  try {
    const pdfs = await Pdf.find().sort({ createdAt: -1 });
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
