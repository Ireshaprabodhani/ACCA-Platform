const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');

router.put('/language', authMiddleware, userController.updateLanguage);

module.exports = router;
