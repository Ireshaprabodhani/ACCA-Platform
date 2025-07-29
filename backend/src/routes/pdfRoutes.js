const express = require('express');
const router = express.Router();
const adminPdfController = require('../controllers/adminPdfController');
const pdfDownloadController = require('../controllers/pdfDownloadController');
const multer = require('multer');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage });

// Admin routes
router.post('/admin/upload', upload.single('pdf'), adminPdfController.uploadPdf);
router.get('/admin/:identifier', adminPdfController.getPdfByIdentifier);

// Public download route
router.get('/download/:identifier', pdfDownloadController.downloadPdf);

module.exports = router;