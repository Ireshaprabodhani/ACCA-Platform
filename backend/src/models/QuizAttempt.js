
const mongoose = require('mongoose');

const quizAttemptSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  questions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'QuizQuestion' }],
  answers: [Number], // user selected option indexes
  score: Number,
  submittedAt: Date,
  language: String,
  schoolName: String,
},

{ timestamps: true } 
 
);

module.exports = mongoose.model('QuizAttempt', quizAttemptSchema);
