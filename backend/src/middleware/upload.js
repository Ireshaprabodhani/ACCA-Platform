// src/middleware/upload.js
const path = require('path');
const fs = require('fs');
const multer = require('multer');

// make sure the folder exists at boot
const UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    // logo-1666598263440.png
    const ext = path.extname(file.originalname);          // .png  / .jpg
    cb(null, `logo-${Date.now()}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  // only allow png / jpeg / svg
  if (/image\/(png|jpeg|jpg|svg\+xml)/i.test(file.mimetype)) return cb(null, true);
  cb(new Error('Only image files are allowed'));
};

module.exports = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },  // 2 MB
  fileFilter,
});
