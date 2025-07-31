// routes/pdfRoute.js
const express = require('express');
const router = express.Router();
const pdfCtrl = require('../controllers/adminPdfController');
const auth = require('../middlewares/authMiddleware'); // ← same middleware

router.get('/', auth, pdfCtrl.listPdfs);
router.get('/:id', auth, pdfCtrl.getPdf);
router.get('/download/:id', auth, pdfCtrl.downloadPdf);

module.exports = router;
