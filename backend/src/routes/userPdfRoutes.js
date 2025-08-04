import express from 'express';
import auth from '../middleware/authMiddleware.js';
import * as pdfController from '../controllers/pdfController.js';

const router = express.Router();

router.get('/', auth, pdfController.getAllForUser);
router.get('/download/:id', auth, pdfController.downloadPdf);

export default router;
