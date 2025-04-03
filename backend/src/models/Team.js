const mongoose = require("mongoose");

const TeamSchema = new mongoose.Schema({
  teamName: { type: String, required: true }, // School name (auto-filled)
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Main User
  students: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  teachers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }]
});

module.exports = mongoose.model("Team", TeamSchema);
