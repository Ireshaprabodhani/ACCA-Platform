import Admin from '../models/Admin.js';
import User from '../models/User.js';
import QuizAttempt from '../models/QuizAttempt.js';
import CaseAttempt from '../models/CaseAttempt.js';
import QuizQuestion from '../models/QuizQuestion.js';
import CaseQuestion from '../models/CaseQuestion.js';
import Video from '../models/Video.js';
import Score from '../models/Score.js';
import Logo from '../models/Logo.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// POST /admin/login
export const login = async (req, res) => {
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

export const addUserWithMembers = async (req, res) => {
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

// export const resetUsersCollection = async (req, res) => {
//   try {
//     // Delete all users
//     await User.deleteMany({});
    
//     // Drop all indexes except _id
//     await User.collection.dropIndexes();
    
//     // Recreate the unique email index
//     await User.collection.createIndex({ email: 1 }, { unique: true });
    
//     // Recreate other indexes
//     await User.collection.createIndex({ firstName: 1 });
//     await User.collection.createIndex({ age: 1 });
    
//     res.json({ 
//       message: 'Users collection reset successfully. All indexes recreated.' 
//     });
//   } catch (error) {
//     console.error('Error resetting users collection:', error);
//     res.status(500).json({ 
//       message: 'Error resetting collection', 
//       error: error.message 
//     });
//   }
// };

export const debugUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('email firstName lastName');
    const indexes = await User.collection.indexes();
    
    res.json({
      userCount: users.length,
      users: users,
      indexes: indexes
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// get users 
export const getUsers = async (req, res) => {
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
export const deleteUser = async (req, res) => {
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
export const getQuizAttemptStatus = async (req, res) => {
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
        userName    : u ? `${u.firstName} ${u.lastName ?? ''}`.trim() : 'Deleted User',
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

export const getCaseAttemptStatus = async (req, res) => {
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
        userName    : u ? `${u.firstName} ${u.lastName ?? ''}`.trim() : 'Deleted User',
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

export const deleteQuizAttempt = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedAttempt = await QuizAttempt.findByIdAndDelete(id);

    if (!deletedAttempt) {
      return res.status(404).json({ message: 'Quiz attempt not found' });
    }

    res.json({ 
      message: 'Quiz attempt deleted successfully', 
      id: deletedAttempt._id 
    });
  } catch (error) {
    console.error('Delete quiz attempt error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete multiple quiz attempts (by school name or all)
export const deleteQuizAttempts = async (req, res) => {
  try {
    const { schoolName } = req.query;

    let filter = {};
    if (schoolName) {
      // Find users from the specific school
      const users = await User.find({ schoolName }).select('_id');
      if (users.length === 0) {
        return res.json({ 
          deletedCount: 0, 
          message: `No users found for school: ${schoolName}` 
        });
      }
      const userIds = users.map(u => u._id);
      filter = { userId: { $in: userIds } };
    }

    const result = await QuizAttempt.deleteMany(filter);

    res.json({
      deletedCount: result.deletedCount,
      message: schoolName 
        ? `Deleted ${result.deletedCount} quiz attempt(s) from ${schoolName}`
        : `Deleted ${result.deletedCount} quiz attempt(s)`
    });
  } catch (error) {
    console.error('Delete quiz attempts error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete single case study attempt
export const deleteCaseAttempt = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedAttempt = await CaseAttempt.findByIdAndDelete(id);

    if (!deletedAttempt) {
      return res.status(404).json({ message: 'Case study attempt not found' });
    }

    res.json({ 
      message: 'Case study attempt deleted successfully', 
      id: deletedAttempt._id 
    });
  } catch (error) {
    console.error('Delete case attempt error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete multiple case study attempts (by school name or all)
export const deleteCaseAttempts = async (req, res) => {
  try {
    const { schoolName } = req.query;

    let filter = {};
    if (schoolName) {
      // Find users from the specific school
      const users = await User.find({ schoolName }).select('_id');
      if (users.length === 0) {
        return res.json({ 
          deletedCount: 0, 
          message: `No users found for school: ${schoolName}` 
        });
      }
      const userIds = users.map(u => u._id);
      filter = { userId: { $in: userIds } };
    }

    const result = await CaseAttempt.deleteMany(filter);

    res.json({
      deletedCount: result.deletedCount,
      message: schoolName 
        ? `Deleted ${result.deletedCount} case study attempt(s) from ${schoolName}`
        : `Deleted ${result.deletedCount} case study attempt(s)`
    });
  } catch (error) {
    console.error('Delete case attempts error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


export const getSchoolResults = async (req, res) => {
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
export const getStats = async (req, res) => {
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
export const getLeaderboard = async (req, res) => {
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

// Create default export with all functions
const adminController = {
  login,
  addUserWithMembers,
  getUsers,
  deleteUser,
  getQuizAttemptStatus,
  getCaseAttemptStatus,
  deleteQuizAttempt,
  deleteQuizAttempts,
  deleteCaseAttempt,
  deleteCaseAttempts,
  getSchoolResults,
  getStats,
  getLeaderboard
};

export default adminController;