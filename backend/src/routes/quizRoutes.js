
import express from 'express';
import quizController from '../controllers/quizController.js'
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/questions', authMiddleware, quizController.getRandomQuizQuestions);
router.post('/submit', authMiddleware, quizController.submitQuizAnswers);

router.get(
  '/has-attempted',                 
  authMiddleware,
  quizController.hasUserAttemptedQuiz
);


export default router;

