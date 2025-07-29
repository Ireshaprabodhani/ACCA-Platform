const Pdf = require('../models/Pdf');
const fs = require('fs');

exports.downloadPdf = async (req, res) => {
  try {
    const pdf = await Pdf.findOne({ identifier: req.params.identifier });
    
    if (!pdf) {
      return res.status(404).json({ message: 'PDF not found' });
    }

    if (!fs.existsSync(pdf.path)) {
      return res.status(404).json({ message: 'File not found on server' });
    }

    res.download(pdf.path, pdf.filename);
    
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};