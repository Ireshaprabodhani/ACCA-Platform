const QuizQuestion = require('../models/QuizQuestion');
const QuizAttempt = require('../models/QuizAttempt');
const mongoose = require('mongoose');

// Add a quiz question by admin
exports.addQuizQuestion = async (req, res) => {
  try {
    const { question, options, answer, language } = req.body;

    if (!question || !options || options.length !== 4 || answer === undefined || !language) {
      return res.status(400).json({ message: 'Invalid question format' });
    }

    const newQuestion = new QuizQuestion({ question, options, answer, language });
    await newQuestion.save();
    res.json({ message: 'Question added', newQuestion });
  } catch (error) {
    console.error("Error in addQuizQuestion:", error);
    res.status(500).json({ message: error.message });
  }
};

// Update a quiz question by admin
exports.updateQuizQuestion = async (req, res) => {
  try {
    const question = await QuizQuestion.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }
    res.json(question);
  } catch (error) {
    console.error("Error in updateQuizQuestion:", error);
    res.status(500).json({ message: error.message });
  }
};

// Delete a quiz question by admin
exports.deleteQuizQuestion = async (req, res) => {
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
exports.getRandomQuizQuestions = async (req, res) => {
  try {
    const user = req.user;

    // ✅ Get language from query OR user OR default to English
    const language = (req.query.language || user.language || 'English')
      .trim()
      .toLowerCase()
      .replace(/^\w/, c => c.toUpperCase());

    if (!['English', 'Sinhala'].includes(language)) {
      return res.status(400).json({ message: 'Invalid language selected' });
    }

    const questions = await QuizQuestion.aggregate([
      { $match: { language } },
      { $sample: { size: 15 } },
    ]);

    if (questions.length !== 15) {
      return res.status(500).json({ message: 'Not enough quiz questions in the database.' });
    }

    res.json(questions);
  } catch (error) {
    console.error("Error in getRandomQuizQuestions:", error);
    res.status(500).json({ message: error.message });
  }
};


// Submit answers by users
exports.submitQuizAnswers = async (req, res) => {
  try {
    const user = req.user;
    const userId = user.id;
    const { answers } = req.body;

    // Validate
    if (!Array.isArray(answers) || answers.length !== 15) {
      return res.status(400).json({ message: 'You must provide exactly 15 answers.' });
    }

    // Check if already submitted
    const existingAttempt = await QuizAttempt.findOne({ userId });
    if (existingAttempt) {
      return res.status(403).json({ message: 'Quiz already submitted' });
    }

    // ✅ Get language from query OR user OR default to English
    const language = (req.query.language || user.language || 'English')
      .trim()
      .toLowerCase()
      .replace(/^\w/, c => c.toUpperCase());

    if (!['English', 'Sinhala'].includes(language)) {
      return res.status(400).json({ message: 'Invalid language selected' });
    }

    // Get 15 questions
    const questions = await QuizQuestion.aggregate([
      { $match: { language } },
      { $sample: { size: 15 } },
    ]);

    if (questions.length !== 15) {
      return res.status(500).json({ message: 'Not enough questions in the database.' });
    }

    // Calculate score
    let score = 0;
    answers.forEach((ans, i) => {
      if (questions[i] && questions[i].answer === ans) score++;
    });

    // Save attempt
    const quizAttempt = new QuizAttempt({
      userId,
      questions: questions.map(q => q._id),
      answers,
      score,
      submittedAt: new Date(),
      language,
      schoolName: req.user.schoolName,
     });

    await quizAttempt.save();

    res.json({ message: 'Quiz submitted', score });
  } catch (error) {
    console.error("Error in submitQuizAnswers:", error);
    res.status(500).json({ message: error.message });
  }
};


