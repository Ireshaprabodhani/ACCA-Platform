import mongoose from "mongoose";

const quizQuestionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  options: [{ type: String, required: true }],
  answer: { type: Number, required: true },
  language: { type: String, enum: ['English', 'Sinhala'], required: true },
});

export default mongoose.model('QuizQuestion', quizQuestionSchema);
