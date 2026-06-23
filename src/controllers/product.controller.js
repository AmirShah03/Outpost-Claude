const productService = require('../services/product.service');

const getProducts = async (req, res, next) => {
  try {
    const { search, category_id, min_price, max_price, page, limit } = req.query;
    const result = await productService.getProducts({
      search, category_id, min_price, max_price, page, limit,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
};

const getProductById = async (req, res, next) => {
  try {
    const product = await productService.getProductById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(product);
  } catch (err) {
    next(err);
  }
};

const getCategories = async (req, res, next) => {
  try {
    const categories = await productService.getCategories();
    res.json(categories);
  } catch (err) {
    next(err);
  }
};

module.exports = { getProducts, getProductById, getCategories };
