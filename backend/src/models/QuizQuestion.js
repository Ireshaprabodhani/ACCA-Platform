
const mongoose = require('mongoose');

const quizQuestionSchema = new mongoose.Schema({
  question: String,
  options: [String], // 4 options
  answer: Number, // index of correct option
  language: { type: String, enum: ['English', 'Sinhala'] },
  schoolName: String, // optional tag for school-specific questions
});

module.exports = mongoose.model('QuizQuestion', quizQuestionSchema);
