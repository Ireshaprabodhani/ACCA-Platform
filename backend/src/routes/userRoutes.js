const express = require("express");
const { signup, userLogin } = require("../controllers/userController");
const { createTeam } = require("../controllers/teamController");
const { userAuth } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/register", signup);
router.post("/login", userLogin);

router.post("/team", userAuth, createTeam);

module.exports = router;
