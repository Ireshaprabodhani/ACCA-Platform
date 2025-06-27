const mongoose = require('mongoose');

const logoSchema = new mongoose.Schema({
  filename: String,
  path: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Logo', logoSchema);
