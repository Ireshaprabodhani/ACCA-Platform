const express = require('express');
const router = express.Router();
const adminCtrl = require('../controllers/adminController');
const quizCtrl = require('../controllers/quizController');
const caseCtrl = require('../controllers/caseController');
const videoCtrl = require('../controllers/videoController');
const adminAuth = require('../middleware/adminMiddleware');

// Admin Auth
router.post('/login', adminCtrl.login);

// Quiz Management
router.post('/quiz', adminAuth, quizCtrl.addQuizQuestion);
router.put('/quiz/:id', adminAuth, quizCtrl.updateQuizQuestion);
router.delete('/quiz/:id', adminAuth, quizCtrl.deleteQuizQuestion);

// Case Management
router.post('/case', adminAuth, caseCtrl.addCaseQuestion);
router.put('/case/:id', adminAuth, caseCtrl.updateCaseQuestion);
router.delete('/case/:id', adminAuth, caseCtrl.deleteCaseQuestion);

// Video Management
router.post('/video', adminAuth, videoCtrl.setVideo); 
router.get('/video/:type/:language', adminAuth, videoCtrl.getVideo);
router.delete('/video/:type/:language', adminAuth, videoCtrl.deleteVideo); 


// User & Attempt Tracking
router.get('/users', adminAuth, adminCtrl.getUsers);
router.get('/quiz-status', adminAuth, adminCtrl.getQuizStatus);
router.get('/case-status', adminAuth, adminCtrl.getCaseStatus);

module.exports = router;
