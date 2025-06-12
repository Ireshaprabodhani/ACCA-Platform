
const express = require('express');
const router = express.Router();
const caseController = require('../controllers/caseController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/video', authMiddleware, caseController.getCaseVideo);
router.get('/questions', authMiddleware, caseController.getCaseQuestions);
router.post('/submit', authMiddleware, caseController.submitCaseAnswers);

module.exports = router;
