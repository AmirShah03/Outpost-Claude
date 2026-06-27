const Joi = require('joi');

const schemas = {
  register: Joi.object({
    name: Joi.string().min(2).max(255).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).max(128).required(),
    phone: Joi.string().allow('', null).max(50),
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  }),

  addToCart: Joi.object({
    variant_id: Joi.number().integer().positive().required(),
    quantity: Joi.number().integer().min(1).default(1),
  }),

  updateCart: Joi.object({
    quantity: Joi.number().integer().min(1).required(),
  }),

  createOrder: Joi.object({
    shipping_address: Joi.string().required(),
    shipping_name: Joi.string().required(),
    shipping_phone: Joi.string().required(),
    payment_method: Joi.string().valid('card', 'online_banking').required(),
    points_to_use: Joi.number().integer().min(0).default(0),
  }),

  cardPayment: Joi.object({
    order_id: Joi.number().integer().positive().required(),
    card_number: Joi.string().pattern(/^\d{16}$/).required(),
    expiry_date: Joi.string().pattern(/^(0[1-9]|1[0-2])\/\d{2}$/).required(),
    cvv: Joi.string().pattern(/^\d{3,4}$/).required(),
    cardholder_name: Joi.string().optional(),
  }),

  updateProfile: Joi.object({
    name: Joi.string().min(2).max(255),
    phone: Joi.string().allow('', null).max(50),
    address: Joi.string().allow('', null),
  }).min(1),

  cancelOrder: Joi.object({
    reason: Joi.string().min(5).required(),
  }),

  updateOrderStatus: Joi.object({
    tracking_id: Joi.string().min(5).required(),
    expected_delivery: Joi.string().isoDate().allow('', null),
  }),

  generateReport: Joi.object({
    month: Joi.number().integer().min(1).max(12).required(),
    year: Joi.number().integer().min(2020).required(),
  }),

  updateReport: Joi.object({
    title: Joi.string().max(255),
    data: Joi.object(),
  }).min(1),
};

const validate = (schemaName) => {
  return (req, res, next) => {
    const schema = schemas[schemaName];
    if (!schema) {
      return res.status(500).json({ error: 'Validation schema not found' });
    }

    const { error, value } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) {
      const messages = error.details.map((d) => d.message);
      return res.status(400).json({ error: 'Validation failed', details: messages });
    }

    req.validatedBody = value;
    next();
  };
};

module.exports = { validate, schemas };
