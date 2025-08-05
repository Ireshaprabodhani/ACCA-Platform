import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';

// Import controllers
import * as adminCtrl from '../controllers/adminController.js';
import * as quizCtrl from '../controllers/quizController.js';
import * as caseCtrl from '../controllers/caseController.js';
import * as videoCtrl from '../controllers/videoController.js';

// Import middleware
import adminAuth from '../middleware/adminMiddleware.js';

const router = express.Router();

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure storage for PDF uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads/pdfs'));
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  }
});

// Admin Auth
router.post('/login', adminCtrl.login);

// Quiz Management
router.get('/quiz',       adminAuth, quizCtrl.listQuizQuestions); 
router.get('/quiz/:id',   adminAuth, quizCtrl.getQuizQuestion);   
router.post('/quiz',      adminAuth, quizCtrl.addQuizQuestion);
router.put('/quiz/:id',   adminAuth, quizCtrl.updateQuizQuestion);
router.delete('/quiz/:id',adminAuth, quizCtrl.deleteQuizQuestion);

// Case Management
router.get('/case',       adminAuth, caseCtrl.listCaseQuestions); 
router.get('/case/:id',   adminAuth, caseCtrl.getCaseQuestion);  
router.post('/case',      adminAuth, caseCtrl.addCaseQuestion);
router.put('/case/:id',   adminAuth, caseCtrl.updateCaseQuestion);
router.delete('/case/:id',adminAuth, caseCtrl.deleteCaseQuestion);

// Video Management
router.post('/video',        adminAuth, videoCtrl.setVideo);
router.get('/video/:type',   adminAuth, videoCtrl.getVideoByType);
router.delete('/video/:type',adminAuth, videoCtrl.deleteVideo);

// User Tracking
router.post('/users',       adminAuth, adminCtrl.addUserWithMembers);
router.get('/users',        adminAuth, adminCtrl.getUsers);
router.delete('/users/:id', adminAuth, adminCtrl.deleteUser);  

// Attempt Tracking
router.get('/quiz-status',  adminAuth, adminCtrl.getQuizAttemptStatus);
router.get('/case-status',  adminAuth, adminCtrl.getCaseAttemptStatus);
router.get('/results',      adminAuth, adminCtrl.getSchoolResults);
router.get('/stats',        adminAuth, adminCtrl.getStats);
router.get('/leaderboard',  adminAuth, adminCtrl.getLeaderboard);

export default router;