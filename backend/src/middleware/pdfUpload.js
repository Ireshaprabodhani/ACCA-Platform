const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Resolve absolute path from server.js
const uploadDir = path.join(__dirname, 'uploads/pdfs');
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir); // absolute path
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + file.originalname.replace(/\s+/g, '-');
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext !== '.pdf') {
      return cb(new Error('Only PDFs allowed'));
    }
    cb(null, true);
  },
});

module.exports = upload;
