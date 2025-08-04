// adminPDFRoutes.js - ES Module version
import express from 'express';
import adminMiddleware from '../middlewares/adminMiddleware.js';
import upload from '../middlewares/pdfUpload.js';
import * as pdfController from '../controllers/pdfController.js';

const router = express.Router();

// Admin-only routes
router.post('/', adminMiddleware, upload.single('pdf'), pdfController.uploadPdf);
router.get('/', adminMiddleware, pdfController.listPdfs);
router.put('/:id', adminMiddleware, pdfController.editPdf);
router.delete('/:id', adminMiddleware, pdfController.deletePdf);

// View route
router.get('/view/:id', adminMiddleware, pdfController.viewPdf);

export default router;