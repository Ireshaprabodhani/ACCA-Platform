const mongoose = require('mongoose');

const caseQuestionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  options: { type: [String], required: true, validate: v => v.length >= 2 },
  correctAnswer: { type: Number, required: true, min: 0 },   // renamed field here
  language: { type: String, enum: ['English', 'Sinhala'], required: true },
});

module.exports = mongoose.model('CaseQuestion', caseQuestionSchema);