const router = require('express').Router();
const orderController = require('../controllers/order.controller');
const { authenticate } = require('../middleware/auth');
const { roleGuard } = require('../middleware/roleGuard');
const { validate } = require('../utils/validators');

router.use(authenticate, roleGuard('customer'));

router.post('/', validate('createOrder'), orderController.createOrder);
router.get('/', orderController.getOrders);
router.get('/:id', orderController.getOrderById);
router.post('/:id/cancel', validate('cancelOrder'), orderController.cancelOrder);

module.exports = router;
