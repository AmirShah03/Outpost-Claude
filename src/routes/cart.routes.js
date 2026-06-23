const router = require('express').Router();
const cartController = require('../controllers/cart.controller');
const { authenticate } = require('../middleware/auth');
const { roleGuard } = require('../middleware/roleGuard');
const { validate } = require('../utils/validators');

router.use(authenticate, roleGuard('customer'));

router.get('/', cartController.getCart);
router.post('/', validate('addToCart'), cartController.addToCart);
router.put('/:itemId', validate('updateCart'), cartController.updateCartItem);
router.delete('/:itemId', cartController.removeCartItem);

module.exports = router;
