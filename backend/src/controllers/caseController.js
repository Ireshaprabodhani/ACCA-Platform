// controllers/caseController.js
const CaseQuestion = require('../models/CaseQuestion');
const CaseAttempt = require('../models/CaseAttempt');
const Video = require('../models/Video');


exports.addCaseQuestion = async (req, res) => {
  const { question, options, correctAnswer, language } = req.body;
  const newquestion = new CaseQuestion({ question, options, correctAnswer, language });
  await newquestion.save();
  res.json({ message: 'Case question added', newquestion });
};


exports.updateCaseQuestion = async (req, res) => {
  const question = await CaseQuestion.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(question);
};


exports.deleteCaseQuestion = async (req, res) => {
  await CaseQuestion.findByIdAndDelete(req.params.id);
  res.json({ message: 'Case question deleted' });
};

exports.listCaseQuestions = async (req, res) => {
  try {
    const { language, search, page = 1, limit = 50 } = req.query;

    const filter = {};
    if (language) filter.language = language;
    if (search)  filter.question = { $regex: search, $options: 'i' };

    const skip = (page - 1) * limit;

    const [total, questions] = await Promise.all([
      CaseQuestion.countDocuments(filter),
      CaseQuestion.find(filter)
        .sort({ createdAt: -1 })          // newest first
        .skip(skip)
        .limit(Number(limit))
    ]);

    res.json({ total, page: Number(page), questions });
  } catch (err) {
    console.error('listCaseQuestions:', err);
    res.status(500).json({ message: 'Server error' });
  }
};


exports.getCaseQuestion = async (req, res) => {
  try {
    const q = await CaseQuestion.findById(req.params.id);
    if (!q) return res.status(404).json({ message: 'Not found' });
    res.json(q);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
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

    // Prevent multiple attempts
    const existingAttempt = await CaseAttempt.findOne({ userId: user.id });
    if (existingAttempt)
      return res.status(403).json({ message: 'Case study already attempted' });

    // ✅ Fix: Use req.query.language instead of req.body.language
    const language =
      (req.query.language || user.language || 'English')
        .trim()
        .toLowerCase()
        .replace(/^\w/, c => c.toUpperCase());

    if (!['English', 'Sinhala'].includes(language)) {
      return res.status(400).json({ message: 'Invalid language selected' });
    }

    const questions = await CaseQuestion.aggregate([
      { $match: { language } },
      { $sample: { size: 10 } }
    ]);

    if (questions.length !== 10) {
      return res.status(500).json({ message: 'Not enough case study questions available.' });
    }

    res.json(questions);
  } catch (error) {
    console.error('Error in getCaseQuestions:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.submitCaseAnswers = async (req, res) => {
  try {
    const userId = req.user.id;
    const { answers, timeTaken, language: requestedLanguage } = req.body;

    // Convert answers to numbers to match database format
    const numericAnswers = answers.map(answer => {
      const num = parseInt(answer, 10);
      return isNaN(num) ? answer : num;
    });

    console.log('Original answers:', answers);
    console.log('Converted answers:', numericAnswers);

    // Prevent multiple submissions
    const existingAttempt = await CaseAttempt.findOne({ userId });
    if (existingAttempt)
      return res.status(403).json({ message: 'Case study answers already submitted' });

    const user = req.user;

    // Normalize or default language
    const language =
      (requestedLanguage || user.language || 'English')
        .trim()
        .toLowerCase()
        .replace(/^\w/, c => c.toUpperCase());

    // Fetch 10 random questions in the specified language
    const questions = await CaseQuestion.aggregate([
      { $match: { language, answer: { $type: 'number' } } },
      { $sample: { size: 10 } },
    ]);
      
    if (questions.length !== 10) {
      return res.status(400).json({ message: 'Insufficient case questions found for selected language.' });
    }

    // Calculate score with proper type comparison
    let score = 0;
    for (let i = 0; i < Math.min(numericAnswers.length, questions.length); i++) {
      const userAnswer = numericAnswers[i];
      const correctAnswer = questions[i]?.answer;
      
      // Ensure both are numbers for comparison
      const userNum = typeof userAnswer === 'number' ? userAnswer : parseInt(userAnswer, 10);
      const correctNum = typeof correctAnswer === 'number' ? correctAnswer : parseInt(correctAnswer, 10);
      
      if (!isNaN(userNum) && !isNaN(correctNum) && userNum === correctNum) {
        score++;
      }
    }

    console.log('Calculated score:', score);

    const caseAttempt = new CaseAttempt({
      userId,
      questions: questions.map(q => q._id),
      answers: numericAnswers, // Store the converted answers
      score,
      submittedAt: new Date(),
      language,
      schoolName: user.schoolName || 'Unknown School',
      timeTaken,
    });

    await caseAttempt.save();

    res.json({ message: 'Case study submitted', score });
  } catch (error) {
    console.error('Error in submitCaseAnswers:', error);
    res.status(500).json({ message: error.message });
  }
};


