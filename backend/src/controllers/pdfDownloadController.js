const Pdf = require('../models/Pdf');
const fs = require('fs');
const path = require('path');

exports.uploadPdf = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No PDF file uploaded' });
    }

    const pdf = new Pdf({
      filename: req.file.filename,
      originalName: req.file.originalname,
      path: req.file.path,
      size: req.file.size,
      uploadedBy: req.admin._id // Assuming you have admin info in request
    });

    await pdf.save();
    res.status(201).json(pdf);
  } catch (error) {
    // Clean up uploaded file if error occurs
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: error.message });
  }
};

exports.listPdfs = async (req, res) => {
  try {
    const pdfs = await Pdf.find().select('-path');
    res.json(pdfs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getPdf = async (req, res) => {
  try {
    const pdf = await Pdf.findById(req.params.id).select('-path');
    if (!pdf) {
      return res.status(404).json({ error: 'PDF not found' });
    }
    res.json(pdf);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updatePdf = async (req, res) => {
  try {
    const { title, description } = req.body;
    const pdf = await Pdf.findByIdAndUpdate(
      req.params.id,
      { title, description },
      { new: true }
    ).select('-path');
    
    if (!pdf) {
      return res.status(404).json({ error: 'PDF not found' });
    }
    res.json(pdf);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deletePdf = async (req, res) => {
  try {
    const pdf = await Pdf.findByIdAndDelete(req.params.id);
    if (!pdf) {
      return res.status(404).json({ error: 'PDF not found' });
    }
    
    // Delete the file from filesystem
    if (fs.existsSync(pdf.path)) {
      fs.unlinkSync(pdf.path);
    }
    
    res.json({ message: 'PDF deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.downloadPdf = async (req, res) => {
  try {
    const pdf = await Pdf.findById(req.params.id);
    if (!pdf) {
      return res.status(404).json({ error: 'PDF not found' });
    }
    
    if (!fs.existsSync(pdf.path)) {
      return res.status(404).json({ error: 'File not found on server' });
    }
    
    res.download(pdf.path, pdf.originalName);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};