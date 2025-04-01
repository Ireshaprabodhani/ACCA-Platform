const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true, required: true },
  school: String,
  role: { type: String, default: "student" },
});

module.exports = mongoose.model("User", UserSchema);
