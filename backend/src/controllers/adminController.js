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

// Validation helpers
const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
const nameRegex = /^[a-zA-Z\s\-\']+$/;
const gradeRegex = /^(9|10|11|12|13|University|College)$/i;

const validateUserData = (userData, isUpdate = false) => {
  const errors = [];

  // Validate firstName
  if (!userData.firstName || !userData.firstName.trim()) {
    errors.push('First name is required');
  } else if (!nameRegex.test(userData.firstName.trim())) {
    errors.push('First name can only contain letters, spaces, hyphens, and apostrophes');
  } else if (userData.firstName.trim().length > 50) {
    errors.push('First name cannot exceed 50 characters');
  }

  // Validate lastName
  if (!userData.lastName || !userData.lastName.trim()) {
    errors.push('Last name is required');
  } else if (!nameRegex.test(userData.lastName.trim())) {
    errors.push('Last name can only contain letters, spaces, hyphens, and apostrophes');
  } else if (userData.lastName.trim().length > 50) {
    errors.push('Last name cannot exceed 50 characters');
  }

  // Validate email
  if (!userData.email || !userData.email.trim()) {
    errors.push('Email is required');
  } else if (!emailRegex.test(userData.email.trim())) {
    errors.push('Please enter a valid email address');
  }

  // Validate whatsappNumber
  if (!userData.whatsappNumber || !userData.whatsappNumber.trim()) {
    errors.push('WhatsApp number is required');
  } else {
    const cleanPhone = userData.whatsappNumber.replace(/[\s\-\(\)]/g, '');
    if (!phoneRegex.test(cleanPhone)) {
      errors.push('Please enter a valid phone number');
    }
  }

  // Validate gender
  const validGenders = ['male', 'female', 'other', 'prefer-not-to-say'];
  if (!userData.gender) {
    errors.push('Gender is required');
  } else if (!validGenders.includes(userData.gender.toLowerCase())) {
    errors.push('Gender must be one of: male, female, other, prefer-not-to-say');
  }

  // Validate age
  if (!userData.age) {
    errors.push('Age is required');
  } else {
    const age = Number(userData.age);
    if (isNaN(age) || age <= 0 || age > 150 || !Number.isInteger(age)) {
      errors.push('Age must be a positive integer between 1 and 150');
    }
  }

  // Validate grade
  if (!userData.grade || !userData.grade.toString().trim()) {
  errors.push('Grade is required');
  } else if (!gradeRegex.test(userData.grade.toString().trim())) {
    errors.push('Please enter a valid grade (9-13, University, or College)');
  }

  // Validate schoolName
  if (!userData.schoolName || !userData.schoolName.trim()) {
    errors.push('School name is required');
  } else if (userData.schoolName.trim().length > 100) {
    errors.push('School name cannot exceed 100 characters');
  }

  // Validate password (only for new users)
  if (!isUpdate) {
    if (!userData.password) {
      errors.push('Password is required');
    } else if (userData.password.length < 6) {
      errors.push('Password must be at least 6 characters long');
    }
  }

  // Validate members if present
  if (userData.members && Array.isArray(userData.members)) {
    userData.members.forEach((member, index) => {
      const memberErrors = validateMemberData(member, index);
      errors.push(...memberErrors);
    });
  }

  return errors;
};

const validateMemberData = (memberData, index) => {
  const errors = [];
  const prefix = `Member ${index + 1}: `;

  // Validate firstName
  if (!memberData.firstName || !memberData.firstName.trim()) {
    errors.push(prefix + 'First name is required');
  } else if (!nameRegex.test(memberData.firstName.trim())) {
    errors.push(prefix + 'First name can only contain letters, spaces, hyphens, and apostrophes');
  } else if (memberData.firstName.trim().length > 50) {
    errors.push(prefix + 'First name cannot exceed 50 characters');
  }

  // Validate lastName
  if (!memberData.lastName || !memberData.lastName.trim()) {
    errors.push(prefix + 'Last name is required');
  } else if (!nameRegex.test(memberData.lastName.trim())) {
    errors.push(prefix + 'Last name can only contain letters, spaces, hyphens, and apostrophes');
  } else if (memberData.lastName.trim().length > 50) {
    errors.push(prefix + 'Last name cannot exceed 50 characters');
  }

  // Validate email
  if (!memberData.email || !memberData.email.trim()) {
    errors.push(prefix + 'Email is required');
  } else if (!emailRegex.test(memberData.email.trim())) {
    errors.push(prefix + 'Please enter a valid email address');
  }

  // Validate whatsappNumber
  if (!memberData.whatsappNumber || !memberData.whatsappNumber.trim()) {
    errors.push(prefix + 'WhatsApp number is required');
  } else {
    const cleanPhone = memberData.whatsappNumber.replace(/[\s\-\(\)]/g, '');
    if (!phoneRegex.test(cleanPhone)) {
      errors.push(prefix + 'Please enter a valid phone number');
    }
  }

  // Validate gender
  const validGenders = ['male', 'female', 'other', 'prefer-not-to-say'];
  if (!memberData.gender) {
    errors.push(prefix + 'Gender is required');
  } else if (!validGenders.includes(memberData.gender.toLowerCase())) {
    errors.push(prefix + 'Gender must be one of: male, female, other, prefer-not-to-say');
  }

  // Validate age
  if (!memberData.age) {
    errors.push(prefix + 'Age is required');
  } else {
    const age = Number(memberData.age);
    if (isNaN(age) || age <= 0 || age > 150 || !Number.isInteger(age)) {
      errors.push(prefix + 'Age must be a positive integer between 1 and 150');
    }
  }

  // Validate grade
  if (!memberData.grade || !memberData.grade.toString().trim()) {
    errors.push(prefix + 'Grade is required');
  } else if (!gradeRegex.test(memberData.grade.toString().trim())) {
    errors.push(prefix + 'Please enter a valid grade (K, Pre-K, 1-12, or Kindergarten)');
  }

  return errors;
};

// POST /admin/login
export const login = async (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

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

    // Validate user data
    const validationErrors = validateUserData(req.body);
    
    if (validationErrors.length > 0) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: validationErrors 
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Check for duplicate member emails
    if (members && Array.isArray(members) && members.length > 0) {
      const memberEmails = members.map(m => m.email?.toLowerCase().trim()).filter(Boolean);
      const uniqueEmails = new Set(memberEmails);
      
      if (memberEmails.length !== uniqueEmails.size) {
        return res.status(400).json({ message: 'Duplicate email addresses found in team members' });
      }

      // Check if any member email conflicts with main user email
      if (memberEmails.includes(email.toLowerCase().trim())) {
        return res.status(400).json({ message: 'Team member email cannot be the same as main user email' });
      }

      // Check if any member emails already exist in database
      const existingMemberUsers = await User.find({ 
        email: { $in: memberEmails } 
      });
      
      if (existingMemberUsers.length > 0) {
        return res.status(400).json({ 
          message: 'One or more team member emails are already registered as users' 
        });
      }
    }

    // Create new user with sanitized data
    const userData = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      whatsappNumber: whatsappNumber.trim(),
      email: email.toLowerCase().trim(),
      gender: gender.toLowerCase(),
      age: Number(age),
      password: password,
      grade: grade.toString().trim(),
      schoolName: schoolName.trim(),
    };

    // Sanitize members data if present
    if (members && Array.isArray(members) && members.length > 0) {
      userData.members = members.map(member => ({
        firstName: member.firstName.trim(),
        lastName: member.lastName.trim(),
        whatsappNumber: member.whatsappNumber.trim(),
        email: member.email.toLowerCase().trim(),
        gender: member.gender.toLowerCase(),
        age: Number(member.age),
        grade: member.grade.toString().trim(),
      }));
    }

    const newUser = new User(userData);
    await newUser.save();

    res.status(201).json({
      message: 'User created successfully',
      userId: newUser._id,
    });

  } catch (error) {
    console.error('Error creating user:', error);
    
    // Handle mongoose validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors 
      });
    }

    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({ 
        message: 'User with this email already exists' 
      });
    }

    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Rest of your existing functions remain the same...
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
    const { id } = req.params;  
    const { schoolName } = req.query;    

    if (!id && schoolName) {
      const result = await User.deleteMany({ schoolName });
      return res.json({
        deletedCount: result.deletedCount,
        message: `Deleted ${result.deletedCount} user(s) from ${schoolName}`,
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

    let userIds = undefined;
    if (schoolName) {
      const students = await User.find({ schoolName }).select('_id');
      if (!students.length) return res.json([]);
      userIds = students.map(u => u._id);
    }

    const attempts = await QuizAttempt.find(
        userIds ? { userId: { $in: userIds } } : {}
      )
      .populate('userId', 'firstName lastName email schoolName')
      .populate('questions')
      .lean();

    const result = attempts.map(at => {
      const u = at.userId;
      return {
        id: at._id,
        userName: u ? `${u.firstName} ${u.lastName ?? ''}`.trim() : 'Deleted User',
        email: u ? u.email : 'N/A',
        schoolName: u ? u.schoolName || 'N/A' : 'N/A',
        score: at.score,
        language: at.language,
        submittedAt: at.createdAt,
        answers: at.answers,
        questions: at.questions,
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
        id: at._id,
        userName: u ? `${u.firstName} ${u.lastName ?? ''}`.trim() : 'Deleted User',
        email: u ? u.email : 'N/A',
        schoolName: u ? u.schoolName || 'N/A' : 'N/A',
        score: at.score,
        language: at.language,
        submittedAt: at.createdAt,
        answers: at.answers,
        questions: at.questions,
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

export const deleteQuizAttempts = async (req, res) => {
  try {
    const { schoolName } = req.query;

    let filter = {};
    if (schoolName) {
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

export const deleteCaseAttempts = async (req, res) => {
  try {
    const { schoolName } = req.query;

    let filter = {};
    if (schoolName) {
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
    const quizAgg = await QuizAttempt.aggregate([
      { $group: {
          _id: '$schoolName',
          quizAttempts: { $sum: 1 },
          quizAvg: { $avg: '$score' },
        }
      }
    ]);

    const caseAgg = await CaseAttempt.aggregate([
      { $group: {
          _id: '$schoolName',
          caseAttempts: { $sum: 1 },
          caseAvg: { $avg: '$score' },
        }
      }
    ]);

    const map = new Map();
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

    const result = [...map.values()].map(r => ({
      ...r,
      quizAvg: Number(r.quizAvg?.toFixed(2) ?? 0),
      caseAvg: Number(r.caseAvg?.toFixed(2) ?? 0),
    }));

    res.json(result);
  } catch (err) {
    console.error('getSchoolResults:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

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

export const getLeaderboard = async (req, res) => {
  try {
    const [quizAgg, caseAgg] = await Promise.all([
      QuizAttempt.aggregate([
        { $group: {
            _id: '$userId',
            quizAttempts: { $sum: 1 },
            quizTotalScore: { $sum: '$score' },
            quizAvgScore: { $avg: '$score' },
        } }
      ]),
      CaseAttempt.aggregate([
        { $group: {
            _id: '$userId',
            caseAttempts: { $sum: 1 },
            caseTotalScore: { $sum: '$score' },
            caseAvgScore: { $avg: '$score' },
        } }
      ]),
    ]);

    const map = new Map();

    const attach = (arr, type) => {
      arr.forEach(d => {
        const key = d._id.toString();
        const rec = map.get(key) || {
          userId: d._id,
          quizAttempts: 0, quizTotalScore: 0, quizAvgScore: 0,
          caseAttempts: 0, caseTotalScore: 0, caseAvgScore: 0,
        };

        if (type === 'quiz') {
          rec.quizAttempts = d.quizAttempts;
          rec.quizTotalScore = d.quizTotalScore;
          rec.quizAvgScore = d.quizAvgScore;
        } else {
          rec.caseAttempts = d.caseAttempts;
          rec.caseTotalScore = d.caseTotalScore;
          rec.caseAvgScore = d.caseAvgScore;
        }

        map.set(key, rec);
      });
    };

    attach(quizAgg, 'quiz');
    attach(caseAgg, 'case');

    const leaderboardData = await Promise.all(
      [...map.values()].map(async entry => {
        const user = await User.findById(entry.userId)
                               .select('firstName lastName email schoolName')
                               .lean();

        const quizMarks = entry.quizTotalScore || 0;
        const caseMarks = entry.caseTotalScore || 0;
        const totalMarks = quizMarks + caseMarks;

        return {
          userId: entry.userId,
          userName: user ? `${user.firstName} ${user.lastName || ''}`.trim()
                         : 'Unknown User',
          email: user?.email || 'N/A',
          schoolName: user?.schoolName || 'N/A',
          quizMarks: Number(quizMarks.toFixed(2)),
          caseMarks: Number(caseMarks.toFixed(2)),
          totalMarks: Number(totalMarks.toFixed(2)),
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
  getLeaderboard,
  debugUsers
};

export default adminController;