// intro video
import Video from '../models/Video.js';


export const setVideo = async (req, res) => {
  const { type, url } = req.body;
  if (!type || !url) return res.status(400).json({ error:'Type and URL are required' });

  const video = await Video.findOneAndUpdate(
    { type },
    { url },
    { upsert:true, new:true }
  );
  res.json({ message:'Video saved', video });
};

export const getCaseVideo = async (req, res) => {
  try {
    const caseVideo = await Video.findOne({ type: 'case' }); // ✅ changed from 'heygen'
    if (!caseVideo || !caseVideo.url) {
      return res.status(404).json({ error: 'Case video not found' });
    }

    res.json({ url: caseVideo.url });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch case video', details: err.message });
  }
};


export const deleteVideo = async (req, res) => {
  const { type } = req.params;
  const deleted = await Video.findOneAndDelete({ type });
  if (!deleted) return res.status(404).json({ error:'Video not found' });
  res.json({ message:'Video deleted' });
};



export const getIntroVideo = async (req, res) => {
  try {
    const introVideo = await Video.findOne({ type: 'intro' });
    res.json({ url: introVideo?.url || '' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


export const getVideoByType = async (req, res) => {
  const { type } = req.params;
  if (!['intro', 'case'].includes(type)) {
    return res.status(400).json({ error: 'Invalid video type' });
  }

  try {
    const video = await Video.findOne({ type });
    if (!video || !video.url) {
      return res.status(404).json({ error: 'Video not found' });
    }

    res.json({ type, url: video.url });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch video', details: err.message });
  }
};

const videoController = {
  setVideo,
  getCaseVideo,
  deleteVideo,
  getIntroVideo,
  getVideoByType
};
export default videoController;