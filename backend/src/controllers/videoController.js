const Video = require("../models/Video");

exports.createVideo = async (req, res) => {
  try {
    const video = new Video(req.body);
    await video.save();
    res.json({ message: "Video added", video });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
