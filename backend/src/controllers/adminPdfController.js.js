const Pdf = require('../models/Pdf');
const fs = require('fs');
const path = require('path');

// Configure upload directory
const uploadDir = path.join(__dirname, '../uploads');
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

    const { originalname, filename, path: filePath } = req.file;
    
    // Check if PDF already exists with this identifier
    const existingPdf = await Pdf.findOne({ identifier });
    if (existingPdf) {
      // Delete the old file
      if (fs.existsSync(existingPdf.path)) {
        fs.unlinkSync(existingPdf.path);
      }
      // Update the existing record
      existingPdf.filename = filename;
      existingPdf.path = filePath;
      await existingPdf.save();
      return res.json(existingPdf);
    }

    // Create new PDF record
    const pdf = new Pdf({
      identifier,
      filename: originalname,
      path: filePath
    });

    await pdf.save();
    res.status(201).json(pdf);
    
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getPdfByIdentifier = async (req, res) => {
  try {
    const pdf = await Pdf.findOne({ identifier: req.params.identifier });
    if (!pdf) {
      return res.status(404).json({ message: 'PDF not found' });
    }
    res.json(pdf);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};