const cartService = require('../services/cart.service');

const getCart = async (req, res, next) => {
  try {
    const cart = await cartService.getCart(req.user.id);
    res.json(cart);
  } catch (err) {
    next(err);
  }
};

const addToCart = async (req, res, next) => {
  try {
    const item = await cartService.addToCart(req.user.id, req.validatedBody);
    const cart = await cartService.getCart(req.user.id);
    res.status(201).json({ message: 'Item added to cart', item, cart });
  } catch (err) {
    next(err);
  }
};

const updateCartItem = async (req, res, next) => {
  try {
    await cartService.updateCartItem(req.user.id, req.params.itemId, req.validatedBody);
    const cart = await cartService.getCart(req.user.id);
    res.json({ message: 'Cart updated', cart });
  } catch (err) {
    next(err);
  }
};

const removeCartItem = async (req, res, next) => {
  try {
    await cartService.removeCartItem(req.user.id, req.params.itemId);
    const cart = await cartService.getCart(req.user.id);
    res.json({ message: 'Item removed', cart });
  } catch (err) {
    next(err);
  }
};

module.exports = { getCart, addToCart, updateCartItem, removeCartItem };
