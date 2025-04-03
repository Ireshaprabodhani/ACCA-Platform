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

exports.getAllVideos = async (req, res) => {
  try {
    const videos = await Video.find();
    res.json(videos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getVideoById = async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) return res.status(404).json({ error: "Video not found" });

    res.json(video);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateVideo = async (req, res) => {
  try {
    const updatedVideo = await Video.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedVideo) return res.status(404).json({ error: "Video not found" });

    res.json({ message: "Video updated", updatedVideo });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteVideo = async (req, res) => {
  try {
    const deletedVideo = await Video.findByIdAndDelete(req.params.id);
    if (!deletedVideo) return res.status(404).json({ error: "Video not found" });

    res.json({ message: "Video deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
