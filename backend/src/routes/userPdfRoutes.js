const express = require('express');
const router = express.Router();

const auth = require('../middleware/authMiddleware'); // For user authentication
const pdfController = require('../controllers/pdfController');

// Get all PDFs available for the user
router.get('/', auth, pdfController.getAllForUser);

// Download specific PDF by ID
router.get('/download/:id', auth, pdfController.downloadPdf);

module.exports = router;
