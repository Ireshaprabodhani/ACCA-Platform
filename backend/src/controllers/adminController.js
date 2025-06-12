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

// get users 
exports.getUsers = async (req, res) => {
  try {
    const { schoolName } = req.query;
    const filter = {};

    if (schoolName) {
      filter.schoolName = schoolName;
    }

    const users = await User.find(filter).select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// get quiz status
exports.getQuizStatus = async (req, res) => {
  try {
    const { schoolName } = req.query;

    let attempts;

    if (schoolName) {
      // Find users with the schoolName
      const users = await User.find({ schoolName }).select('_id');
      const userIds = users.map(user => user._id);

      
      attempts = await QuizAttempt.find({ userId: { $in: userIds } }).populate('userId', '-password');
    } else {
      attempts = await QuizAttempt.find().populate('userId', '-password');
    }

   
    const formatted = attempts.map(attempt => {
      const obj = attempt.toObject();
      obj.user = obj.userId;
      delete obj.userId;
      return obj;
    });

    res.json(formatted);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



// get case study status
exports.getCaseStatus = async (req, res) => {
  try {
    const { schoolName } = req.query;

    let attempts;

    if (schoolName) {
      const users = await User.find({ schoolName }).select('_id');
      const userIds = users.map(user => user._id);

      attempts = await CaseAttempt.find({ userId: { $in: userIds } }).populate('userId', '-password');
    } else {
      attempts = await CaseAttempt.find().populate('userId', '-password');
    }

    const formatted = attempts.map(attempt => {
      const obj = attempt.toObject();
      obj.user = obj.userId;
      delete obj.userId;
      return obj;
    });

    res.json(formatted);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


