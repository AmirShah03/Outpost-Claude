const router = require('express').Router();
const productController = require('../controllers/product.controller');

router.get('/', productController.getProducts);
router.get('/categories', productController.getCategories);
router.get('/:id', productController.getProductById);

module.exports = router;
