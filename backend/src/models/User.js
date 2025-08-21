import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import { randomBytes } from 'node:crypto';

// Email validation regex
const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

// Phone number validation regex (supports international formats)
const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;

// Custom validators
const validateEmail = {
  validator: function(email) {
    return emailRegex.test(email);
  },
  message: 'Please enter a valid email address'
};

const validatePhone = {
  validator: function(phone) {
    // Remove spaces, dashes, parentheses for validation
    const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
    return phoneRegex.test(cleanPhone);
  },
  message: 'Please enter a valid phone number'
};

const validateAge = {
  validator: function(age) {
    return age > 0 && age <= 150 && Number.isInteger(age);
  },
  message: 'Age must be a positive integer between 1 and 150'
};

const validateGrade = {
  validator: function(grade) {
    // Allow grades 9-13 and university/college
    const validGrades = /^(9|10|11|12|13|University|College)$/i;
    return validGrades.test(grade.toString());
  },
  message: 'Please enter a valid grade (9-13, University, or College)'
};

const validateName = {
  validator: function(name) {
    // Only allow letters, spaces, hyphens, and apostrophes
    const nameRegex = /^[a-zA-Z\s\-\']+$/;
    return nameRegex.test(name) && name.trim().length > 0;
  },
  message: 'Name can only contain letters, spaces, hyphens, and apostrophes'
};

const memberSchema = new mongoose.Schema({
  firstName: { 
    type: String, 
    required: [true, 'First name is required'], 
    index: true,
    trim: true,
    minlength: [1, 'First name must be at least 1 character'],
    maxlength: [50, 'First name cannot exceed 50 characters'],
    validate: validateName
  },
  lastName: { 
    type: String, 
    required: [true, 'Last name is required'],
    trim: true,
    minlength: [1, 'Last name must be at least 1 character'],
    maxlength: [50, 'Last name cannot exceed 50 characters'],
    validate: validateName
  },
  whatsappNumber: { 
    type: String, 
    required: [true, 'WhatsApp number is required'],
    trim: true,
    validate: validatePhone
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    lowercase: true,
    trim: true,
    validate: validateEmail
  },
  gender: { 
    type: String, 
    required: [true, 'Gender is required'],
    enum: {
      values: ['male', 'female', 'other', 'prefer-not-to-say'],
      message: 'Gender must be one of: male, female, other, prefer-not-to-say'
    }
  },
  age: { 
    type: Number, 
    index: true, 
    required: [true, 'Age is required'],
    validate: validateAge
  },
  grade: { 
    type: String, 
    required: [true, 'Grade is required'],
    trim: true,
    validate: validateGrade
  },
  resetPasswordToken: String,
  resetPasswordExpires: Date,
}, {
  timestamps: true
});

const userSchema = new mongoose.Schema({
  firstName: { 
    type: String, 
    required: [true, 'First name is required'], 
    trim: true,
    minlength: [1, 'First name must be at least 1 character'],
    maxlength: [50, 'First name cannot exceed 50 characters'],
    validate: validateName
  },
  lastName: { 
    type: String, 
    required: [true, 'Last name is required'], 
    trim: true,
    minlength: [1, 'Last name must be at least 1 character'],
    maxlength: [50, 'Last name cannot exceed 50 characters'],
    validate: validateName
  },
  whatsappNumber: { 
    type: String, 
    required: [true, 'WhatsApp number is required'], 
    trim: true,
    validate: validatePhone
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    validate: validateEmail
  },
  gender: { 
    type: String, 
    required: [true, 'Gender is required'],
    enum: {
      values: ['male', 'female', 'other', 'prefer-not-to-say'],
      message: 'Gender must be one of: male, female, other, prefer-not-to-say'
    }
  },
  age: { 
    type: Number, 
    required: [true, 'Age is required'],
    validate: validateAge
  },
  password: { 
    type: String, 
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long']
  },
  grade: { 
    type: String, 
    required: [true, 'Grade is required'],
    trim: true,
    validate: validateGrade
  },
  schoolName: { 
    type: String, 
    required: [true, 'School name is required'], 
    trim: true,
    minlength: [1, 'School name must be at least 1 character'],
    maxlength: [100, 'School name cannot exceed 100 characters']
  },
  members: [memberSchema],
  lastLoginAt: { type: Date },
  resetPasswordToken: String,
  resetPasswordExpires: Date,
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