import express from 'express';
import caseController from '../controllers/caseController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/video', authMiddleware, caseController.getCaseVideo);
router.get('/questions', authMiddleware, caseController.getCaseQuestions);
router.post('/submit', authMiddleware, caseController.submitCaseAnswers);

export default router;