
const express = require('express');
const router = express.Router();
const videoController = require('../controllers/videoController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/intro', authMiddleware, videoController.getIntroVideo);

module.exports = router;
