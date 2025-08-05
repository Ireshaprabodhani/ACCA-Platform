
import express from 'express';
import videoController from '../controllers/videoController.js'
import authMiddleware from '../middleware/authMiddleware.js';
const router = express.Router();

router.get('/intro', authMiddleware, videoController.getIntroVideo);

export default router;
