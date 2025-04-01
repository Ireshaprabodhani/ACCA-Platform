const mongoose = require("mongoose");

const VideoSchema = new mongoose.Schema({
  title: String,
  url: String,
});

module.exports = mongoose.model("Video", VideoSchema);
