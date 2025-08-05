import User from '../models/User.js'

export const updateLanguage = async (req, res) => {
  try {
    const userId = req.user.id; // from auth middleware
    const { language } = req.body;
    if (!['English', 'Sinhala'].includes(language))
      return res.status(400).json({ message: 'Invalid language' });

    const user = await User.findByIdAndUpdate(userId, { language }, { new: true });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const userController = {
  updateLanguage,
};
export default userController;