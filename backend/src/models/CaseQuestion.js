
const mongoose = require('mongoose');

const caseQuestionSchema = new mongoose.Schema({
  question: String,
  options: [String], 
  correctAnswer: Number,   
  language: { type: String, enum: ['English', 'Sinhala'] }, 
});

module.exports = mongoose.model('CaseQuestion', caseQuestionSchema);
