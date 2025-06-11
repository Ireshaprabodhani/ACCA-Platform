// controllers/caseController.js
const CaseQuestion = require('../models/CaseQuestion');
const CaseAttempt = require('../models/CaseAttempt');
const Video = require('../models/Video');


exports.addCaseQuestion = async (req, res) => {
  const { questionText, options, correctAnswer, language } = req.body;
  const question = new CaseQuestion({ questionText, options, correctAnswer, language });
  await question.save();
  res.json({ message: 'Case question added', question });
};


exports.updateCaseQuestion = async (req, res) => {
  const question = await CaseQuestion.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(question);
};


exports.deleteCaseQuestion = async (req, res) => {
  await CaseQuestion.findByIdAndDelete(req.params.id);
  res.json({ message: 'Case question deleted' });
};

exports.getCaseVideo = async (req, res) => {
  try {
    const caseVideo = await Video.findOne({ type: 'case' });
    if (!caseVideo) return res.status(404).json({ message: 'Case video not found' });

    res.json({ url: caseVideo.url });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getCaseQuestions = async (req, res) => {
  try {
    const user = req.user;

    // Check if user already attempted case study
    const existingAttempt = await CaseAttempt.findOne({ userId: user.id });
    if (existingAttempt)
      return res.status(403).json({ message: 'Case study already attempted' });

    const matchConditions = { language: user.language };
    if (user.schoolName) matchConditions.schoolName = user.schoolName;

    // Fetch all questions or limit if needed, e.g. 10 questions
    const questions = await CaseQuestion.aggregate([
      { $match: matchConditions },
      { $sample: { size: 10 } } // adjust size as needed
    ]);

    res.json(questions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.submitCaseAnswers = async (req, res) => {
  try {
    const userId = req.user.id;
    const { answers, timeTaken } = req.body;  // answers = array of selected option indexes, timeTaken in seconds

    // Prevent multiple submissions
    const existingAttempt = await CaseAttempt.findOne({ userId });
    if (existingAttempt)
      return res.status(403).json({ message: 'Case study answers already submitted' });

    const user = req.user;
    const matchConditions = { language: user.language };
    if (user.schoolName) matchConditions.schoolName = user.schoolName;

    // Fetch case questions (should match what frontend used)
    const questions = await CaseQuestion.aggregate([
      { $match: matchConditions },
      { $sample: { size: 10 } }
    ]);

    // Calculate score
    let score = 0;
    answers.forEach((ans, i) => {
      if (questions[i].answer === ans) score++;
    });

    const caseAttempt = new CaseAttempt({
      userId,
      questions: questions.map(q => q._id),
      answers,
      score,
      submittedAt: new Date(),
      language: user.language,
      schoolName: user.schoolName || null,
      timeTaken,
    });

    await caseAttempt.save();

    res.json({ message: 'Case study submitted', score });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
