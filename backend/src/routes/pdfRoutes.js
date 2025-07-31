const express = require('express');
const router = express.Router();
const pdfCtrl = require('../controllers/adminPdfController');
const auth = require('../middlewares/authMiddleware');

// 🔁 More specific route goes first
router.get('/download/:id', auth, pdfCtrl.downloadPdf);
router.get('/:id', auth, pdfCtrl.getPdf);
router.get('/', auth, pdfCtrl.listPdfs);

module.exports = router;
