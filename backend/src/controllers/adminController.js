const Admin = require('../models/Admin');
const User = require('../models/User');
const QuizAttempt = require('../models/QuizAttempt');
const CaseAttempt = require('../models/CaseAttempt');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// POST /admin/login
exports.login = async (req, res) => {
  const { email, password } = req.body;
  const admin = await Admin.findOne({ email });
  if (!admin) return res.status(400).json({ error: 'Admin not found' });

  const isMatch = await bcrypt.compare(password, admin.password);
  if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });

  const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
  res.json({ token });
};

// GET /admin/users
exports.getUsers = async (req, res) => {
  const users = await User.find().select('-password');
  res.json(users);
};

// GET /admin/quiz-status
exports.getQuizStatus = async (req, res) => {
  const attempts = await QuizAttempt.find().populate('user');
  res.json(attempts);
};

// GET /admin/case-status
exports.getCaseStatus = async (req, res) => {
  const attempts = await CaseAttempt.find().populate('user');
  res.json(attempts);
};
