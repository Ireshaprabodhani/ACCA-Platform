
const QuizQuestion = require('../models/QuizQuestion');
const QuizAttempt = require('../models/QuizAttempt');
const mongoose = require('mongoose');


exports.addQuizQuestion = async (req, res) => {
  const { questionText, options, correctAnswer, language } = req.body;
  const question = new QuizQuestion({ questionText, options, correctAnswer, language });
  await question.save();
  res.json({ message: 'Question added', question });
};


exports.updateQuizQuestion = async (req, res) => {
  const question = await QuizQuestion.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(question);
};


exports.deleteQuizQuestion = async (req, res) => {
  await QuizQuestion.findByIdAndDelete(req.params.id);
  res.json({ message: 'Question deleted' });
};

exports.getRandomQuizQuestions = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = req.user;

    // Check if user already attempted quiz
    const existingAttempt = await QuizAttempt.findOne({ userId });
    if (existingAttempt)
      return res.status(403).json({ message: 'Quiz already attempted' });

    // Fetch 15 random questions matching language & optional school
    const matchConditions = { language: user.language };
    if (user.schoolName) matchConditions.schoolName = user.schoolName;

    const questions = await QuizQuestion.aggregate([
      { $match: matchConditions },
      { $sample: { size: 15 } },
    ]);

    res.json(questions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.submitQuizAnswers = async (req, res) => {
  try {
    const userId = req.user.id;
    const { answers } = req.body; // array of option indexes

    const user = req.user;

    // Check if user already submitted
    const existingAttempt = await QuizAttempt.findOne({ userId });
    if (existingAttempt)
      return res.status(403).json({ message: 'Quiz already submitted' });

    // Fetch questions used in quiz (to verify answers)
    // If you saved questions on frontend, send question IDs with answers or just re-fetch random 15 same way
    // For simplicity, re-fetch random questions again (but ideally frontend sends question IDs)
    const matchConditions = { language: user.language };
    if (user.schoolName) matchConditions.schoolName = user.schoolName;
    const questions = await QuizQuestion.aggregate([{ $match: matchConditions }, { $sample: { size: 15 } }]);

    // Calculate score
    let score = 0;
    answers.forEach((ans, i) => {
      if (questions[i].answer === ans) score++;
    });

    const quizAttempt = new QuizAttempt({
      userId,
      questions: questions.map(q => q._id),
      answers,
      score,
      submittedAt: new Date(),
      language: user.language,
      schoolName: user.schoolName || null,
    });

    await quizAttempt.save();

    res.json({ message: 'Quiz submitted', score });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
