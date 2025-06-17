const mongoose = require('mongoose');

const scoreSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  quizMarks: { type: Number, default: 0 },
  caseMarks: { type: Number, default: 0 },
  competitionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Competition' }, // optional if you have multiple competitions
});

module.exports = mongoose.model('Score', scoreSchema);
