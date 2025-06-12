
const express = require('express');
const router = express.Router();
const quizController = require('../controllers/quizController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/questions', authMiddleware, quizController.getRandomQuizQuestions);
router.post('/submit', authMiddleware, quizController.submitQuizAnswers);

module.exports = router;

