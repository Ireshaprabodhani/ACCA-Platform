

import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import { randomBytes } from 'node:crypto';

const memberSchema = new mongoose.Schema({
  firstName: { type: String, required: true, index: true },
  lastName: { type: String, required: true },
  whatsappNumber: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  gender: { type: String, required: true },
  age: { type: Number, index: true, required: true },
  grade: { type: String, required: true },
  resetPasswordToken: String,
  resetPasswordExpires: Date,
}, {
  timestamps: true
});

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  whatsappNumber: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  gender: { type: String, required: true },
  age: { type: Number, required: true },
  password: { type: String, required: true },
  grade: { type: String, required: true },
  schoolName: { type: String, required: true },
  members: [memberSchema],
}, {
  timestamps: true
});

// Hash password before save
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.generatePasswordReset = function () {
  this.resetPasswordToken = randomBytes(20).toString('hex');
  this.resetPasswordExpires = Date.now() + 3600000; // 1 hour
};

const User = mongoose.model('User', userSchema);
export default User;
