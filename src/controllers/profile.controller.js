const profileService = require('../services/profile.service');

const getProfile = async (req, res, next) => {
  try {
    const profile = await profileService.getProfile(req.user.id);
    res.json(profile);
  } catch (err) {
    next(err);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const profile = await profileService.updateProfile(req.user.id, req.validatedBody);
    res.json({ message: 'Profile updated successfully', profile });
  } catch (err) {
    next(err);
  }
};

module.exports = { getProfile, updateProfile };
