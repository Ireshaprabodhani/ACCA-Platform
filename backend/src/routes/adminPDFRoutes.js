const express = require('express');
const router = express.Router();
const pdfCtrl = require('../controllers/adminPdfController');
const adminAuth = require('../middlewares/adminMiddleware'); // Admin auth

// Admin-only routes
router.post('/upload', adminAuth, upload.single('pdf'), pdfCtrl.uploadPdf);
router.delete('/:id', adminAuth, pdfCtrl.deletePdf);
router.post('/',         adminAuth, upload.single('pdf'), pdfCtrl.uploadPdf);
router.get('/',          adminAuth, pdfCtrl.listPdfs);
router.get('/:id',      adminAuth, pdfCtrl.getPdf);
router.put('/:id',      adminAuth, pdfCtrl.updatePdf);


module.exports = router;