const Pdf = require('../models/Pdf');
const path = require('path');
const fs = require('fs');



// Upload
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

exports.viewPdf = async (req, res) => {
  const { id } = req.params;
  const pdf = await Pdf.findById(id);
  if (!pdf) return res.status(404).json({ message: 'PDF not found' });

  const filePath = path.join(__dirname, '../uploads/pdfs/', pdf.filename);
  
  // Stream the file instead of download
  const fileStream = fs.createReadStream(filePath);
  res.setHeader('Content-Type', 'application/pdf');
  fileStream.pipe(res);
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
