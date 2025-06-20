const User = require('../models/User');
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const bcrypt = require('bcrypt');

require('dotenv').config();


exports.register = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      whatsappNumber,
      email,
      gender,
      age,
      password,
      grade,
      schoolName,
      members,
    } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: 'User already exists' });

    const user = new User({
      firstName,
      lastName,
      whatsappNumber,
      email,
      gender,
      age,
      password,
      grade,
      schoolName,
      members,
    });

    await user.save();

    const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, {
      expiresIn: '1d',
    });

    res.status(201).json({ user, token });
  } catch (error) {
    console.error("Register Error:", error);
    res.status(500).json({ message: error.message });
  }
};


exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    let account = await Admin.findOne({ email });
    let role = 'admin';

    if (!account) {
      account = await User.findOne({ email });
      role = 'user';
    }

    if (!account) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isValid = await account.comparePassword(password);
    if (!isValid) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      {
        id: account._id,
        email: account.email,
        role: role
      },
      process.env.JWT_SECRET,
      {
        expiresIn: '1d',
      }
    );

    res.json({ user: account, token, role });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.logout = async (req, res) => {
  try {
    // You can optionally blacklist the token here if you implement token blacklisting
    res.status(200).json({ message: 'Logout successful' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Logout failed' });
  }
};


// forgot password
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.generatePasswordReset();
    await user.save();

    // Send the reset URL to frontend (frontend calls EmailJS)
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${user.resetPasswordToken}`;

    res.json({ message: 'Password reset link generated', resetUrl });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};


//reset password
exports.resetPassword = async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  try {
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });
    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    user.password = password;  // will be hashed in pre-save hook
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    res.json({ message: 'Password has been reset successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};


