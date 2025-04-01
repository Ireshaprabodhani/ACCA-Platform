const mongoose = require("mongoose");

const AdminSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
});

module.exports = mongoose.model("GameAdmin", AdminSchema);
