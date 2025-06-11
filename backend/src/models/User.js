const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  teamName: { type: String, required: true },
  members: [{ type: String, required: true }], 
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  language: { type: String, enum: ['English', 'Sinhala'], default: 'English' },
  createdAt: { type: Date, default: Date.now },
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
