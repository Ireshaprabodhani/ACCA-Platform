const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  phone: { type: String, required: true },
  school: { type: String, required: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["student", "teacher"], default: "student" },
});

module.exports = mongoose.model("User", UserSchema);
