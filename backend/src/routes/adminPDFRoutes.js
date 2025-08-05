import express from 'express';
import adminMiddleware from '../middleware/adminMiddleware.js';
import upload from '../middleware/pdfUpload.js';
import * as pdfController from '../controllers/pdfController.js';

const router = express.Router();

// Add debugging middleware for troubleshooting
const debugMiddleware = (req, res, next) => {
  console.log(`${req.method} ${req.originalUrl}`);
  console.log('Headers:', {
    authorization: req.headers.authorization ? 'Present' : 'Missing',
    contentType: req.headers['content-type']
  });
  next();
};

// Apply debug middleware to all routes (remove in production)
router.use(debugMiddleware);

router.post('/', adminMiddleware, upload.single('pdf'), pdfController.uploadPdf);
router.get('/', adminMiddleware, pdfController.listPdfs);

// Add the debugging auth middleware to view route for troubleshooting
router.get('/view/:id', adminMiddleware, pdfController.debugAuth, pdfController.viewPdf);
router.get('/download/:id', adminMiddleware, pdfController.downloadPdf);
router.delete('/:id', adminMiddleware, pdfController.deletePdf);
router.put('/:id', adminMiddleware, pdfController.editPdf);

// Debug routes
router.get('/debug-env', adminMiddleware, pdfController.debugEnvironment);

export default router;