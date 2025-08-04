import express from 'express';
import adminMiddleware from '../middleware/adminMiddleware.js';
import upload from '../middleware/pdfUpload.js';
import * as pdfController from '../controllers/pdfController.js';

const router = express.Router();

router.post('/', adminMiddleware, upload.single('pdf'), pdfController.uploadPdf);
router.get('/', adminMiddleware, pdfController.listPdfs);
router.put('/:id', adminMiddleware, pdfController.editPdf);
router.delete('/:id', adminMiddleware, pdfController.deletePdf);
router.get('/view/:id', adminMiddleware, pdfController.viewPdf);

export default router;
