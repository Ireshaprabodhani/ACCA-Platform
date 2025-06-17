// intro video
const Video = require('../models/Video');



exports.setVideo = async (req, res) => {
  const { type, url } = req.body;
  if (!type || !url) return res.status(400).json({ error:'Type and URL are required' });

  const video = await Video.findOneAndUpdate(
    { type },
    { url },
    { upsert:true, new:true }
  );
  res.json({ message:'Video saved', video });
};

exports.getVideo = async (req, res) => {
  const { type } = req.params;
  const video = await Video.findOne({ type });
  if (!video) return res.status(404).json({ error:'Video not found' });
  res.json(video);
};

exports.deleteVideo = async (req, res) => {
  const { type } = req.params;
  const deleted = await Video.findOneAndDelete({ type });
  if (!deleted) return res.status(404).json({ error:'Video not found' });
  res.json({ message:'Video deleted' });
};



exports.getIntroVideo = async (req, res) => {
  try {
    const introVideo = await Video.findOne({ type: 'intro' });
    res.json({ url: introVideo?.url || '' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
