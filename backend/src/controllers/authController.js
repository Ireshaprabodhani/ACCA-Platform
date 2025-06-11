const User = require('../models/User');
const jwt = require('jsonwebtoken');
require('dotenv').config();

exports.register = async (req, res) => {
  try {
    const { teamName, members, email, password, language } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: 'User already exists' });

    const user = new User({ teamName, members, email, password, language });
    await user.save();

    const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, {
      expiresIn: '1d',
    });

    res.status(201).json({ user, token });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user)
      return res.status(400).json({ message: 'Invalid credentials' });

    const validPass = await user.comparePassword(password);
    if (!validPass)
      return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, {
      expiresIn: '1d',
    });

    res.json({ user, token });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
