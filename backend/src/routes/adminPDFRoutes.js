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
router.get('/test-view', (req, res) => {
  console.log('✅ Test view route hit');
  res.json({ message: 'Test view route works!', timestamp: new Date() });
});

router.get('/view/:id', (req, res) => {
  console.log('🔍 View route hit with ID:', req.params.id);
  res.json({ 
    message: 'View route reached!', 
    id: req.params.id,
    timestamp: new Date()
  });
});

module.exports = router;