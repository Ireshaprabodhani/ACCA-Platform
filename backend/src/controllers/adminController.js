const Admin = require('../models/Admin');
const User = require('../models/User');
const QuizAttempt = require('../models/QuizAttempt');
const CaseAttempt = require('../models/CaseAttempt');
const QuizQuestion = require('../models/QuizQuestion');
const CaseQuestion = require('../models/CaseQuestion');
const Video = require('../models/Video');
const Score = require('../models/Score');
const Logo = require('../models/Logo');
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

exports.addUserWithMembers = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      whatsappNumber,
      email,
      gender,
      age,
      password,
      grade,
      schoolName,
      members, // optional array
    } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Create new user
    const newUser = new User({
      firstName,
      lastName,
      whatsappNumber,
      email,
      gender,
      age,
      password,
      grade,
      schoolName,
      members, // can be undefined or array of member objects
    });

    await newUser.save();

    res.status(201).json({
      message: 'User created successfully',
      userId: newUser._id,
    });

  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
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

// delete user
exports.deleteUser = async (req, res) => {
  try {
    const { id }         = req.params;  
    const { schoolName } = req.query;    

   
    if (!id && schoolName) {
      const result = await User.deleteMany({ schoolName });
      return res.json({
        deletedCount: result.deletedCount,
        message     : `Deleted ${result.deletedCount} user(s) from ${schoolName}`,
      });
    }

    
    if (!id) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    const user = await User.findByIdAndDelete(id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'User deleted successfully', id: user._id });
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


// get stats
exports.getStats = async (req, res) => {
  try {
    const usersCount = await User.countDocuments();
    const quizQCount = await QuizQuestion.countDocuments();
    const caseQCount = await CaseQuestion.countDocuments();
    const videosCount = await Video.countDocuments();

    res.json({
      users: usersCount,
      quizQ: quizQCount,
      caseQ: caseQCount,
      videos: videosCount,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// display leaderboard

exports.getLeaderboard = async (req, res) => {
  try {
    /* 1. run the two aggregations */
    const [quizAgg, caseAgg] = await Promise.all([
      QuizAttempt.aggregate([
        { $group: {
            _id: '$userId',
            quizAttempts   : { $sum: 1 },
            quizTotalScore : { $sum: '$score' },
            quizAvgScore   : { $avg: '$score' },
        } }
      ]),
      CaseAttempt.aggregate([
        { $group: {
            _id: '$userId',
            caseAttempts   : { $sum: 1 },
            caseTotalScore : { $sum: '$score' },
            caseAvgScore   : { $avg: '$score' },
        } }
      ]),
    ]);

    /* 2. merge the two result sets */
    const map = new Map();           // key = userId as string

    const attach = (arr, type) => {
      arr.forEach(d => {
        const key = d._id.toString();                // <- ONE canonical key
        const rec = map.get(key) || {
          userId          : d._id,
          quizAttempts    : 0, quizTotalScore : 0, quizAvgScore : 0,
          caseAttempts    : 0, caseTotalScore : 0, caseAvgScore : 0,
        };

        if (type === 'quiz') {
          rec.quizAttempts    = d.quizAttempts;
          rec.quizTotalScore  = d.quizTotalScore;
          rec.quizAvgScore    = d.quizAvgScore;
        } else {
          rec.caseAttempts    = d.caseAttempts;
          rec.caseTotalScore  = d.caseTotalScore;
          rec.caseAvgScore    = d.caseAvgScore;
        }

        map.set(key, rec);           // overwrite / insert
      });
    };

    attach(quizAgg, 'quiz');
    attach(caseAgg, 'case');

    /* 3. decorate with user info & sort */
    const leaderboardData = await Promise.all(
      [...map.values()].map(async entry => {
        const user = await User.findById(entry.userId)
                               .select('firstName lastName email schoolName')
                               .lean();

        const quizMarks  = entry.quizTotalScore || 0;
        const caseMarks  = entry.caseTotalScore || 0;
        const totalMarks = quizMarks + caseMarks;

        return {
          userId      : entry.userId,
          userName    : user ? `${user.firstName} ${user.lastName || ''}`.trim()
                             : 'Unknown User',
          email       : user?.email      || 'N/A',
          schoolName  : user?.schoolName || 'N/A',
          quizMarks   : Number(quizMarks.toFixed(2)),
          caseMarks   : Number(caseMarks.toFixed(2)),
          totalMarks  : Number(totalMarks.toFixed(2)),
        };
      })
    );

    leaderboardData.sort((a, b) => b.totalMarks - a.totalMarks);
    res.json(leaderboardData);
  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};




