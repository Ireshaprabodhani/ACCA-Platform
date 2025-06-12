const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const memberSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  whatsappNumber: String,
  email: String,
  gender: String,
  age: Number,
  grade: String,
});

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: String,
  whatsappNumber: String,
  email: { type: String, required: true, unique: true },
  gender: String,
  age: Number,
  password: { type: String, required: true },
  grade: String,
  schoolName: String,
  members: [memberSchema],
});

// Hash password before save
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = function (password) {
  return bcrypt.compare(password, this.password);
};

module.exports = mongoose.model('User', userSchema);
