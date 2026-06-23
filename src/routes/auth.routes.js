const router = require('express').Router();
const authController = require('../controllers/auth.controller');
const { validate } = require('../utils/validators');

router.post('/register', validate('register'), authController.register);
router.post('/login', validate('login'), authController.login);
router.post('/logout', authController.logout);

module.exports = router;
