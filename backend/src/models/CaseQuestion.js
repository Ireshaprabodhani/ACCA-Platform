
const mongoose = require('mongoose');

const caseQuestionSchema = new mongoose.Schema({
  question: String,
  options: [String], 
  answer: Number,   
  language: { type: String, enum: ['English', 'Sinhala'] },
  schoolName: String,  
});

module.exports = mongoose.model('CaseQuestion', caseQuestionSchema);
