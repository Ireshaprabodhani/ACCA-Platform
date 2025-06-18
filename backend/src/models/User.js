const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const { randomBytes } = require('node:crypto');

const memberSchema = new mongoose.Schema({
  firstName: { type: String, required: true, index: true },
  lastName: String,
  whatsappNumber: String,
  email: { type: String, required: true, unique: true } ,
  gender: String,
  age: { type: Number, index: true },
  grade: { type: String, required: true },
  resetPasswordToken: String,
  resetPasswordExpires: Date,
},

{ timestamps: true } 


);

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
  
},

{ timestamps: true } 

);

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
  this.resetPasswordToken   = randomBytes(20).toString('hex');
  this.resetPasswordExpires = Date.now() + 3600000; // 1 hour
};

module.exports = mongoose.model('User', userSchema);
