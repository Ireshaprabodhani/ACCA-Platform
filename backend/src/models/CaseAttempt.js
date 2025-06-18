
const mongoose = require('mongoose');

const caseAttemptSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  questions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'CaseQuestion' }],
  answers: [Number],    // user selected option indexes
  score: Number,
  submittedAt: Date,
  language: String,
  schoolName: String,
  timeTaken: Number,    // time taken to complete in seconds (optional)
},
 { timestamps: true } 
);

module.exports = mongoose.model('CaseAttempt', caseAttemptSchema);
