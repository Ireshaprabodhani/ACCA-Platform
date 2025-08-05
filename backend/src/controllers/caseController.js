
import CaseQuestion from '../models/CaseQuestion.js';
import CaseAttempt from '../models/CaseAttempt.js';
import Video from '../models/Video.js';

export const addCaseQuestion = async (req, res) => {
  try {
    const { question, options, correctAnswer, language } = req.body;
    const newquestion = new CaseQuestion({ question, options, correctAnswer, language });
    await newquestion.save();
    res.json({ message: 'Case question added', newquestion });
  } catch (error) {
    console.error('Error adding case question:', error.message);
    res.status(400).json({ message: error.message });
  }
};

export const updateCaseQuestion = async (req, res) => {
  const question = await CaseQuestion.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(question);
};

export const deleteCaseQuestion = async (req, res) => {
  await CaseQuestion.findByIdAndDelete(req.params.id);
  res.json({ message: 'Case question deleted' });
};

export const listCaseQuestions = async (req, res) => {
  try {
    const { language, search, page = 1, limit = 50 } = req.query;

    const filter = {};
    if (language) filter.language = language;
    if (search) filter.question = { $regex: search, $options: 'i' };

    const skip = (page - 1) * limit;

    const [total, questions] = await Promise.all([
      CaseQuestion.countDocuments(filter),
      CaseQuestion.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
    ]);

    res.json({ total, page: Number(page), questions });
  } catch (err) {
    console.error('listCaseQuestions:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getCaseQuestion = async (req, res) => {
  try {
    const q = await CaseQuestion.findById(req.params.id);
    if (!q) return res.status(404).json({ message: 'Not found' });
    res.json(q);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getCaseVideo = async (req, res) => {
  try {
    const caseVideo = await Video.findOne({ type: 'case' });
    if (!caseVideo) return res.status(404).json({ message: 'Case video not found' });

    res.json({ url: caseVideo.url });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getCaseQuestions = async (req, res) => {
  try {
    const user = req.user;

    const existingAttempt = await CaseAttempt.findOne({ userId: user.id });
    if (existingAttempt)
      return res.status(403).json({ message: 'Case study already attempted' });

    const language = (req.query.language || user.language || 'English')
      .trim()
      .toLowerCase()
      .replace(/^\w/, c => c.toUpperCase());

    if (!['English', 'Sinhala'].includes(language)) {
      return res.status(400).json({ message: 'Invalid language selected' });
    }

    const questions = await CaseQuestion.aggregate([
      { $match: { language } },
      { $sample: { size: 15 } },
    ]);

    if (questions.length !== 15) {
      return res.status(500).json({ message: 'Not enough case study questions available.' });
    }

    res.json(questions);
  } catch (error) {
    console.error('Error in getCaseQuestions:', error);
    res.status(500).json({ message: error.message });
  }
};

export const submitCaseAnswers = async (req, res) => {
  try {
    const userId = req.user.id;
    const { answers, timeTaken, language: requestedLanguage } = req.body;

    const numericAnswers = answers.map(answer => {
      const num = parseInt(answer, 10);
      return isNaN(num) ? answer : num;
    });

    const existingAttempt = await CaseAttempt.findOne({ userId });
    if (existingAttempt)
      return res.status(403).json({ message: 'Case study answers already submitted' });

    const user = req.user;

    const language = (requestedLanguage || user.language || 'English')
      .trim()
      .toLowerCase()
      .replace(/^\w/, c => c.toUpperCase());

    const questions = await CaseQuestion.aggregate([
      { $match: { language, correctAnswer: { $type: 'number' } } },
      { $sample: { size: 15 } },
    ]);

    if (questions.length !== 15) {
      return res.status(400).json({ message: 'Insufficient case questions found for selected language.' });
    }

    let score = 0;
    for (let i = 0; i < Math.min(numericAnswers.length, questions.length); i++) {
      const userAnswer = numericAnswers[i];
      const correctAnswer = questions[i]?.correctAnswer;

      const userNum = typeof userAnswer === 'number' ? userAnswer : parseInt(userAnswer, 10);
      const correctNum = typeof correctAnswer === 'number' ? correctAnswer : parseInt(correctAnswer, 10);

      if (!isNaN(userNum) && !isNaN(correctNum) && userNum === correctNum) {
        score++;
      }
    }

    const caseAttempt = new CaseAttempt({
      userId,
      questions: questions.map(q => q._id),
      answers: numericAnswers,
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

const caseController = {
  addCaseQuestion,
  updateCaseQuestion,
  deleteCaseQuestion,
  listCaseQuestions,
  getCaseQuestion,
  getCaseVideo,
  getCaseQuestions,
  submitCaseAnswers
};

export default caseController;