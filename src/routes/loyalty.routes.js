const router = require('express').Router();
const loyaltyController = require('../controllers/loyalty.controller');
const { authenticate } = require('../middleware/auth');
const { roleGuard } = require('../middleware/roleGuard');

router.use(authenticate, roleGuard('customer'));

router.get('/', loyaltyController.getLoyalty);

module.exports = router;
