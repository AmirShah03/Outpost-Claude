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

const createProduct = async (req, res, next) => {
  try {
    const { name, description, category_id } = req.body;
    let variants = req.body.variants;
    if (typeof variants === 'string') {
      try { variants = JSON.parse(variants); } catch (e) { variants = []; }
    }
    
    let image_url = null;
    if (req.file) {
      image_url = `/uploads/${req.file.filename}`;
    }

    const product = await productService.createProduct({
      name, description, category_id, image_url, variants
    });

    res.status(201).json({ message: 'Product created successfully', product });
  } catch (err) {
    next(err);
  }
};

const updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, category_id } = req.body;
    let variants = req.body.variants;
    if (typeof variants === 'string') {
      try { variants = JSON.parse(variants); } catch (e) { variants = []; }
    }
    
    let image_url = req.body.image_url || undefined;
    if (req.file) {
      image_url = `/uploads/${req.file.filename}`;
    }

    const product = await productService.updateProduct(id, {
      name, description, category_id, image_url, variants
    });

    res.json({ message: 'Product updated successfully', product });
  } catch (err) {
    next(err);
  }
};

const deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    await productService.deleteProduct(id);
    res.json({ message: 'Product deleted successfully' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getProducts, getProductById, getCategories, createProduct, updateProduct, deleteProduct };
