const Question = require("../models/Question");

exports.createQuestion = async (req, res) => {
  try {
    const question = new Question(req.body);
    await question.save();
    res.json({ message: "Question added", question });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
