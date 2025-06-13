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
  if (!admin) return res.status(400).json({ message: 'Admin not found' });

  const isMatch = await bcrypt.compare(password, admin.password);
  if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

  const token = jwt.sign(
    { id: admin._id, role: 'admin' },   
    process.env.JWT_SECRET,
    { expiresIn: '1d' }
  );

  res.json({ token, role: 'admin' });
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

exports.getQuizAttemptStatus = async (req, res) => {
  try {
    const { schoolName } = req.query;

    /* -------- build base query -------- */
    let userIds = undefined;
    if (schoolName) {
      const students = await User.find({ schoolName }).select('_id');
      if (!students.length) return res.json([]);          // nothing to show
      userIds = students.map(u => u._id);
    }

    const attempts = await QuizAttempt.find(
        userIds ? { userId: { $in: userIds } } : {}
      )
      .populate('userId', 'firstName lastName email schoolName')
      .populate('questions')          // → each question has .options & .answer
      .lean();                        // plain JS objects, cheaper

    const result = attempts.map(at => {
      const u = at.userId;            // might be null
      return {
        id          : at._id,
        userName    : u ? `${u.firstName} ${u.lastName ?? ''}`.trim() : 'Deleted User',
        email       : u ? u.email       : 'N/A',
        schoolName  : u ? u.schoolName  || 'N/A' : 'N/A',
        score       : at.score,
        language    : at.language,
        submittedAt : at.createdAt,
        answers     : at.answers,
        questions   : at.questions,    // populated array (or [])
      };
    });

    res.json(result);
  } catch (err) {
    console.error('getQuizAttemptStatus:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};



exports.getCaseAttemptStatus = async (req, res) => {
  try {
    const { schoolName } = req.query;

    let userIds = undefined;
    if (schoolName) {
      const students = await User.find({ schoolName }).select('_id');
      if (!students.length) return res.json([]);
      userIds = students.map(u => u._id);
    }

    const attempts = await CaseAttempt.find(
        userIds ? { userId: { $in: userIds } } : {}
      )
      .populate('userId', 'firstName lastName email schoolName')
      .populate('questions')
      .lean();

    const result = attempts.map(at => {
      const u = at.userId;
      return {
        id          : at._id,
        userName    : u ? `${u.firstName} ${u.lastName ?? ''}`.trim() : 'Deleted User',
        email       : u ? u.email       : 'N/A',
        schoolName  : u ? u.schoolName  || 'N/A' : 'N/A',
        score       : at.score,
        language    : at.language,
        submittedAt : at.createdAt,
        answers     : at.answers,
        questions   : at.questions,
      };
    });

    res.json(result);
  } catch (err) {
    console.error('getCaseAttemptStatus:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};



exports.getSchoolResults = async (req, res) => {
  try {
    /* ----------- gather quiz aggregate ----------- */
    const quizAgg = await QuizAttempt.aggregate([
      { $group: {
          _id: '$schoolName',
          quizAttempts: { $sum: 1 },
          quizAvg:      { $avg: '$score' },
        }
      }
    ]);

    /* ----------- gather case aggregate ----------- */
    const caseAgg = await CaseAttempt.aggregate([
      { $group: {
          _id: '$schoolName',
          caseAttempts: { $sum: 1 },
          caseAvg:      { $avg: '$score' },
        }
      }
    ]);

    /* ----------- stitch both arrays by schoolName ----------- */
    const map = new Map();      // key = schoolName
    const attach = (arr, key) => {
      arr.forEach(d => {
        const rec = map.get(d._id) || { schoolName: d._id || 'N/A',
                                        quizAttempts:0, quizAvg:0,
                                        caseAttempts:0, caseAvg:0 };
        Object.assign(rec, { ...d, schoolName: d._id || 'N/A' });
        map.set(rec.schoolName, rec);
      });
    };
    attach(quizAgg, 'quiz');
    attach(caseAgg, 'case');

    /* ----------- nice rounding ----------- */
    const result = [...map.values()].map(r => ({
      ...r,
      quizAvg : Number(r.quizAvg ?.toFixed(2) ?? 0),
      caseAvg : Number(r.caseAvg ?.toFixed(2) ?? 0),
    }));

    res.json(result);
  } catch (err) {
    console.error('getSchoolResults:', err);
    res.status(500).json({ message: 'Server error' });
  }
};


