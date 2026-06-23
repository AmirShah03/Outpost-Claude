const orderService = require('../services/order.service');

const createOrder = async (req, res, next) => {
  try {
    const order = await orderService.createOrder(req.user.id, req.validatedBody);
    res.status(201).json({ message: 'Order created successfully', order });
  } catch (err) {
    next(err);
  }
};

const getOrders = async (req, res, next) => {
  try {
    const orders = await orderService.getOrders(req.user.id);
    res.json(orders);
  } catch (err) {
    next(err);
  }
};

const getOrderById = async (req, res, next) => {
  try {
    const order = await orderService.getOrderById(req.params.id, req.user.id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.json(order);
  } catch (err) {
    next(err);
  }
};

const cancelOrder = async (req, res, next) => {
  try {
    const result = await orderService.requestCancellation(
      req.params.id,
      req.user.id,
      req.validatedBody.reason
    );
    res.json({ message: 'Cancellation request submitted', cancellation: result });
  } catch (err) {
    next(err);
  }
};

module.exports = { createOrder, getOrders, getOrderById, cancelOrder };
