const express = require('express');
const router = express.Router();

const adminCtrl = require('../controllers/adminController');
const quizCtrl = require('../controllers/quizController');
const caseCtrl = require('../controllers/caseController');
const videoCtrl = require('../controllers/videoController');
const adminAuth = require('../middleware/adminMiddleware');
const upload = require('../middleware/upload');


// GET logo
router.get('/logo', adminAuth, adminCtrl.getEntryLogo);

// POST logo - upload new logo
router.post('/logo', adminAuth, upload.single('logo'), adminCtrl.uploadLogo);

// PUT logo - update existing logo (remove :id since you're updating the latest one)
router.put('/logo', adminAuth, upload.single('logo'), adminCtrl.updateLogo);

// DELETE logo - delete logo (remove :id since you're deleting the latest one)
router.delete('/logo', adminAuth, adminCtrl.deleteLogo);


// Admin Auth
router.post('/login', adminCtrl.login);

// Quiz Management
router.get('/quiz',       adminAuth, quizCtrl.listQuizQuestions); 
router.get('/quiz/:id',   adminAuth, quizCtrl.getQuizQuestion);   

/* ---- CREATE / UPDATE / DELETE ---- */
router.post('/quiz',        adminAuth, quizCtrl.addQuizQuestion);
router.put('/quiz/:id',     adminAuth, quizCtrl.updateQuizQuestion);
router.delete('/quiz/:id',  adminAuth, quizCtrl.deleteQuizQuestion);


// Case Management
router.get('/case',       adminAuth, caseCtrl.listCaseQuestions); 
router.get('/case/:id',   adminAuth, caseCtrl.getCaseQuestion);  

/* ---- CREATE / UPDATE / DELETE ---- */
router.post('/case', adminAuth, caseCtrl.addCaseQuestion);
router.put('/case/:id', adminAuth, caseCtrl.updateCaseQuestion);
router.delete('/case/:id', adminAuth, caseCtrl.deleteCaseQuestion);

// Video Management
router.post   ('/video',        adminAuth, videoCtrl.setVideo);
router.get    ('/video/:type',  adminAuth, videoCtrl.getVideo);
router.delete ('/video/:type',  adminAuth, videoCtrl.deleteVideo);


// User Tracking
router.get('/users', adminAuth, adminCtrl.getUsers);
router.delete('/users/:id', adminAuth, adminCtrl.deleteUser);  

// Attempt Tracking
router.get('/quiz-status', adminAuth, adminCtrl.getQuizAttemptStatus);
router.get('/case-status', adminAuth, adminCtrl.getCaseAttemptStatus);
router.get('/results', adminAuth, adminCtrl.getSchoolResults);
router.get('/stats', adminAuth, adminCtrl.getStats);
router.get('/leaderboard', adminAuth, adminCtrl.getLeaderboard);

module.exports = router;
