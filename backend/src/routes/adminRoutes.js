const express = require("express");
const { register, login } = require("../controllers/adminController");
const { getUsers, updateUser, deleteUser } = require("../controllers/userController");
const { createQuestion, getAllQuestions, getQuestionById, updateQuestion, deleteQuestion } = require("../controllers/questionController");
const { createVideo,getAllVideos,getVideoById,updateVideo,deleteVideo } = require("../controllers/videoController");
const {getAllTeams,getTeamById,updateTeam,deleteTeam} = require("../controllers/teamController");
const { adminAuth } = require("../middleware/authMiddleware");

const router = express.Router();

// Admin Authentication
router.post("/register", register);
router.post("/login", login);

// User Management (Admin Only)
router.get("/users", adminAuth, getUsers);
router.put("/users/:id", adminAuth, updateUser);
router.delete("/users/:id", adminAuth, deleteUser);

// Question Management (CRUD)
router.post("/questions", adminAuth, createQuestion);  
router.get("/questions", adminAuth, getAllQuestions); 
router.get("/questions/:id", adminAuth, getQuestionById); 
router.put("/questions/:id", adminAuth, updateQuestion); 
router.delete("/questions/:id", adminAuth, deleteQuestion); 


router.post("/videos", adminAuth, createVideo);
router.get("/videos", adminAuth, getAllVideos); 
router.get("/videos/:id", adminAuth, getVideoById);
router.put("/videos/:id", adminAuth, updateVideo);
router.delete("/videos/:id", adminAuth, deleteVideo);


router.get("/teams", adminAuth, getAllTeams); 
router.get("/teams/:id", adminAuth, getTeamById);
router.put("/teams/:id", adminAuth, updateTeam);
router.delete("/teams/:id", adminAuth, deleteTeam);


module.exports = router;
