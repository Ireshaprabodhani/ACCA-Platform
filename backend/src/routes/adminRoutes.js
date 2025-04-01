const express = require("express");
const { register, login } = require("../controllers/adminController");
const { getUsers, updateUser, deleteUser } = require("../controllers/userController");
const { createQuestion } = require("../controllers/questionController");
const { createVideo } = require("../controllers/videoController");
const { adminAuth } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);

router.get("/users", adminAuth, getUsers);
router.put("/users/:id", adminAuth, updateUser);
router.delete("/users/:id", adminAuth, deleteUser);

router.post("/questions", adminAuth, createQuestion);
router.post("/videos", adminAuth, createVideo);

module.exports = router;
