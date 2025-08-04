const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

const adminMiddleware = require('../middlewares/adminMiddleware');
const upload = require('../middlewares/pdfUpload');
const pdfController = require('../controllers/pdfController');

// Alternative admin middleware that accepts token from URL or header
const flexibleAdminAuth = (req, res, next) => {
  const token = req.query.token || req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded.isAdmin) {
      return res.status(403).json({ message: 'Access denied. Admin required.' });
    }
    req.admin = decoded;
    next();
  } catch (error) {
    res.status(400).json({ message: 'Invalid token.' });
  }
};

// Admin-only routes
router.post('/', adminMiddleware, upload.single('pdf'), pdfController.uploadPdf);
router.get('/', adminMiddleware, pdfController.listPdfs);
router.put('/:id', adminMiddleware, pdfController.editPdf);
router.delete('/:id', adminMiddleware, pdfController.deletePdf);

// View route with flexible authentication (header or URL token)
router.get('/view/:id', flexibleAdminAuth, pdfController.viewPdf);

module.exports = router;