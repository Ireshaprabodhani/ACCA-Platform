const express = require('express');
const router = express.Router();

const adminMiddleware = require('../middlewares/adminMiddleware'); 
const upload = require('../middlewares/pdfUpload'); 
const pdfController = require('../controllers/pdfController');

// Admin-only routes
router.post('/', adminMiddleware, upload.single('pdf'), pdfController.uploadPdf);   
router.get('/', adminMiddleware, pdfController.listPdfs);                           
router.put('/:id', adminMiddleware, pdfController.editPdf);                         
router.delete('/:id', adminMiddleware, pdfController.deletePdf);  
router.get('/view/:id', adminMiddleware, pdfController.viewPdf);                   

module.exports = router;
