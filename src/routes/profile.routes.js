const router = require('express').Router();
const profileController = require('../controllers/profile.controller');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../utils/validators');

router.use(authenticate);

router.get('/', profileController.getProfile);
router.put('/', validate('updateProfile'), profileController.updateProfile);

module.exports = router;
