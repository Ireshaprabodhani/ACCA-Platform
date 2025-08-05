import express from 'express';
import adminMiddleware from '../middleware/adminMiddleware.js';
import upload from '../middleware/pdfUpload.js';
import * as pdfController from '../controllers/pdfController.js';

const router = express.Router();

router.post('/', adminMiddleware, upload.single('pdf'), pdfController.uploadPdf);
router.get('/', adminMiddleware, pdfController.listPdfs);
router.get('/view/:id', adminMiddleware, pdfController.viewPdf);
router.get('/download/:id', adminMiddleware, pdfController.downloadPdf);
router.delete('/:id', adminMiddleware, pdfController.deletePdf);
// router.get('/test-config', adminMiddleware, pdfController.testConfig);
router.get('/debug-env', adminMiddleware, pdfController.debugEnvironment);

// add PUT / DELETE as needed for metadata updates or delete (remember to delete from S3 as well)

export default router;
