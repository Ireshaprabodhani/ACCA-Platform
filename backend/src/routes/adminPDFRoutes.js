const express = require('express');
const router = express.Router();

const adminMiddleware = require('../middleware/adminMiddleware');
const upload = require('../middleware/pdfUpload');
const pdfController = require('../controllers/pdfController');

console.log('AdminPDF Routes loaded');

// Test route to verify routing works
router.get('/test', (req, res) => {
  res.json({ message: 'Admin PDF routes working!' });
});

// Admin-only routes
router.post('/', adminMiddleware, upload.single('pdf'), pdfController.uploadPdf);
router.get('/', adminMiddleware, pdfController.listPdfs);
router.put('/:id', adminMiddleware, pdfController.editPdf);
router.delete('/:id', adminMiddleware, pdfController.deletePdf);
router.get('/view/:id', adminMiddleware, pdfController.viewPdf);


module.exports = router;