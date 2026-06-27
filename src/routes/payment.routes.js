const router = require('express').Router();
const paymentController = require('../controllers/payment.controller');
const { authenticate } = require('../middleware/auth');
const { roleGuard } = require('../middleware/roleGuard');
const { validate } = require('../utils/validators');
const { upload } = require('../middleware/upload');

router.use(authenticate, roleGuard('customer'));

router.post('/card', validate('cardPayment'), paymentController.processCardPayment);
router.post('/upload-receipt', upload.single('receipt'), paymentController.uploadReceipt);

module.exports = router;
