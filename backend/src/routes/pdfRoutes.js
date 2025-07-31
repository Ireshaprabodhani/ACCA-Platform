const express = require('express');
const router = express.Router();
const pdfCtrl = require('../controllers/adminPdfController');
const auth = require('../middlewares/authMiddleware'); // Regular user auth

// User-accessible PDF routes
router.get('/', auth, pdfCtrl.listPdfs);
router.get('/download/:id', auth, pdfCtrl.downloadPdf);

module.exports = router;