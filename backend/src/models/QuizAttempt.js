
import mongoose from 'mongoose';

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

export default mongoose.model('QuizAttempt', quizAttemptSchema);
