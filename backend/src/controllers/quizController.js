import QuizQuestion from '../models/QuizQuestion.js';
import QuizAttempt from '../models/QuizAttempt.js';
import mongoose from 'mongoose';

// Add a quiz question by admin
export const addQuizQuestion = async (req, res) => {
  try {
    const { question, options, answer, language } = req.body;

    // basic validation - Changed to support 5 options instead of 5
    if (
      !question?.trim() ||
      !Array.isArray(options) ||
      options.length !== 5 ||  // Changed from 5 to 5
      options.some((o) => !o.trim()) ||
      answer < 0 ||
      answer > 4 ||  // Changed from 3 to 4 for 5 options (0-4)
      !['English', 'Sinhala'].includes(language)
    ) {
      return res.status(400).json({ message: 'Invalid question format' });
    }

    const newQuestion = await QuizQuestion.create({
      question,
      options,
      answer,
      language,
    });

    res.status(201).json({ message: 'Question added', question: newQuestion });
  } catch (error) {
    console.error('addQuizQuestion:', error);
    res.status(500).json({ message: error.message });
  }
};

export const listQuizQuestions = async (req, res) => {
  try {
    console.log('🔍 API called with query:', req.query);
    
    const { language, search, page = 1, limit = 50 } = req.query;

    const filter = {};
    if (language) filter.language = language;
    if (search) filter.question = { $regex: search, $options: 'i' };
    
    console.log('🔍 Using filter:', filter);

    const skip = (page - 1) * limit;

    const [total, questions] = await Promise.all([
      QuizQuestion.countDocuments(filter),
      QuizQuestion.find(filter).skip(skip).limit(Number(limit)),
    ]);

    console.log('📊 Database results:');
    console.log('   - Total count:', total);
    console.log('   - Questions returned:', questions.length);
    console.log('   - First question sample:', questions[0]);
    console.log('   - All question IDs:', questions.map(q => q._id));

    const response = { total, page: Number(page), questions };
    console.log('📤 Sending response:', response);

    res.json(response);
  } catch (err) {
    console.error('❌ Error in listQuizQuestions:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getQuizQuestion = async (req, res) => {
  try {
    const q = await QuizQuestion.findById(req.params.id);
    if (!q) return res.status(404).json({ message: 'Not found' });
    res.json(q);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update a quiz question by admin
export const updateQuizQuestion = async (req, res) => {
  try {
    const { question, options, answer, language } = req.body;

    // Validation for update - same as add
    if (
      question && !question.trim() ||
      options && (!Array.isArray(options) || options.length !== 5 || options.some((o) => !o.trim())) ||
      answer !== undefined && (answer < 0 || answer > 4) ||  // Changed from 3 to 4
      language && !['English', 'Sinhala'].includes(language)
    ) {
      return res.status(400).json({ message: 'Invalid question format' });
    }

    const updatedQuestion = await QuizQuestion.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedQuestion) {
      return res.status(404).json({ message: 'Question not found' });
    }
    res.json(updatedQuestion);
  } catch (error) {
    console.error("Error in updateQuizQuestion:", error);
    res.status(500).json({ message: error.message });
  }
};

// Delete a quiz question by admin
export const deleteQuizQuestion = async (req, res) => {
  try {
    const deleted = await QuizQuestion.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: 'Question not found' });
    }
    res.json({ message: 'Question deleted' });
  } catch (error) {
    console.error("Error in deleteQuizQuestion:", error);
    res.status(500).json({ message: error.message });
  }
};

// Display questions to users
export const getRandomQuizQuestions = async (req, res) => {
  try {
    const user = req.user;
    const language = (req.query.language || user.language || 'English')
      .trim().toLowerCase().replace(/^\w/, c => c.toUpperCase());

    if (!['English', 'Sinhala'].includes(language))
      return res.status(400).json({ message: 'Invalid language selected' });

    const attempt = await QuizAttempt.findOne({ userId: user._id, language });

    if (attempt)
      return res.status(403).json({ message: 'You have already attempted the quiz.' });

    const questions = await QuizQuestion.aggregate([
      { $match: { language } }, { $sample: { size: 15 } }
    ]);

    if (questions.length !== 15)
      return res.status(500).json({ message: 'Not enough quiz questions in the database.' });

    res.json(questions);
  } catch (err) {
    console.error('getRandomQuizQuestions:', err);
    res.status(500).json({ message: err.message });
  }
};

// Submit answers by users
export const submitQuizAnswers = async (req, res) => {
  try {
    const user = req.user;
    const userId = user.id;
    const { answers, timeTaken = 0 } = req.body;

    if (!Array.isArray(answers) || answers.length !== 15)
      return res.status(400).json({ message: 'You must provide exactly 15 answers.' });

    // Validate that all answers are within the valid range (0-4 for 5 options)
    const invalidAnswers = answers.filter(ans => ans < 0 || ans > 4);
    if (invalidAnswers.length > 0) {
      return res.status(400).json({ message: 'All answers must be between 0 and 4.' });
    }

    const existingAttempt = await QuizAttempt.findOne({ userId });
    if (existingAttempt)
      return res.status(403).json({ message: 'Quiz already submitted' });

    const language = (req.query.language || user.language || 'English')
      .trim().toLowerCase().replace(/^\w/, c => c.toUpperCase());

    if (!['English', 'Sinhala'].includes(language))
      return res.status(400).json({ message: 'Invalid language selected' });

    const questions = await QuizQuestion.aggregate([
      { $match: { language } }, { $sample: { size: 15 } }
    ]);

    if (questions.length !== 15)
      return res.status(500).json({ message: 'Not enough questions in the database.' });

    let score = 0;
    answers.forEach((ans, i) => {
      if (questions[i] && questions[i].answer === ans) score++;
    });

    await QuizAttempt.create({
      userId,
      questions: questions.map(q => q._id),
      answers,
      score,
      submittedAt: new Date(),
      language,
      schoolName: user.schoolName || null,
      timeTaken
    });

    res.json({ message: 'Quiz submitted', score });
  } catch (err) {
    console.error('submitQuizAnswers:', err);
    res.status(500).json({ message: err.message });
  }
};

export const hasUserAttemptedQuiz = async (req, res) => {
  try {
    const userId = req.user?.id;
    const lang = (req.query.language || 'English')
      .trim().toLowerCase().replace(/^\w/, c => c.toUpperCase());

    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const attempt = await QuizAttempt.findOne({ userId, language: lang });
    res.json({ hasAttempted: Boolean(attempt) });
  } catch (err) {
    console.error('hasUserAttemptedQuiz:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

const quizController = {
  addQuizQuestion,
  listQuizQuestions,
  getQuizQuestion,
  updateQuizQuestion,
  deleteQuizQuestion,
  getRandomQuizQuestions,
  submitQuizAnswers,
  hasUserAttemptedQuiz
};

export default quizController;