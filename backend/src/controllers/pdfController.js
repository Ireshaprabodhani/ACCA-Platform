const Pdf = require('../models/Pdf');
const path = require('path');
const fs = require('fs');



// Upload
exports.uploadPdf = async (req, res) => {
  const { file } = req;
  if (!file) return res.status(400).json({ message: 'No file uploaded' });

  const pdf = new Pdf({
    path: `/uploads/pdfs/${file.filename}`, // ✅ FIXED: use public path
    originalName: file.originalname,
    size: file.size,
    uploadedBy: req.admin._id,
  });

  await pdf.save();
  res.status(201).json(pdf);
};




// Admin List
exports.listPdfs = async (req, res) => {
  const pdfs = await Pdf.find().sort({ uploadedAt: -1 });
  res.json(pdfs);
};

// Edit PDF metadata
exports.editPdf = async (req, res) => {
  const { id } = req.params;
  const { originalName } = req.body;

  const pdf = await Pdf.findByIdAndUpdate(id, { originalName }, { new: true });
  res.json(pdf);
};

// Delete PDF
exports.deletePdf = async (req, res) => {
  const { id } = req.params;

  const pdf = await Pdf.findById(id);
  if (!pdf) return res.status(404).json({ message: 'PDF not found' });

  fs.unlinkSync(path.join('uploads/pdfs/', pdf.filename));
  await Pdf.findByIdAndDelete(id);
  res.json({ message: 'Deleted successfully' });
};

// User download
exports.downloadPdf = async (req, res) => {
  const { id } = req.params;
  const pdf = await Pdf.findById(id);
  if (!pdf) return res.status(404).json({ message: 'PDF not found' });

  const filePath = path.join(__dirname, '../uploads/pdfs/', pdf.filename);
  res.download(filePath, pdf.originalName);
};

// User view
// User view
exports.getAllForUser = async (req, res) => {
  const pdfs = await Pdf.find().sort({ uploadedAt: -1 });

  const response = pdfs.map(pdf => ({
    _id: pdf._id,
    originalName: pdf.originalName,
    filename: pdf.filename,
    url: `/uploads/pdfs/${encodeURIComponent(pdf.filename)}`
  }));

  res.json(response);
};
