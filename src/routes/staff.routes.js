const router = require('express').Router();
const staffController = require('../controllers/staff.controller');
const { authenticate } = require('../middleware/auth');
const { roleGuard } = require('../middleware/roleGuard');
const { validate } = require('../utils/validators');

router.use(authenticate, roleGuard('staff'));

router.get('/dashboard', staffController.getDashboardStats);
router.get('/orders', staffController.getOrders);
router.get('/orders/:id', staffController.getOrderById);
router.post('/orders/:id/verify', staffController.verifyPayment);
router.put('/orders/:id/status', validate('updateOrderStatus'), staffController.updateOrderStatus);
router.get('/cancellations', staffController.getCancellations);
router.post('/cancellations/:id/approve', staffController.approveCancellation);
router.post('/cancellations/:id/reject', staffController.rejectCancellation);

module.exports = router;
