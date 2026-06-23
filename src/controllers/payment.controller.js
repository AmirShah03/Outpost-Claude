const paymentService = require('../services/payment.service');

const processCardPayment = async (req, res, next) => {
  try {
    const result = await paymentService.processCardPayment(
      req.validatedBody.order_id,
      req.user.id,
      req.validatedBody
    );
    res.json(result);
  } catch (err) {
    next(err);
  }
};

const uploadReceipt = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Receipt file is required' });
    }

    const result = await paymentService.uploadReceipt(
      req.body.order_id,
      req.user.id,
      req.file
    );
    res.json(result);
  } catch (err) {
    next(err);
  }
};

module.exports = { processCardPayment, uploadReceipt };
