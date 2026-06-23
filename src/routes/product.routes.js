const router = require('express').Router();
const productController = require('../controllers/product.controller');
const { authenticate } = require('../middleware/auth');
const { roleGuard } = require('../middleware/roleGuard');
const { upload } = require('../middleware/upload');

router.get('/', productController.getProducts);
router.get('/categories', productController.getCategories);
router.get('/:id', productController.getProductById);

// Staff management routes
router.post('/', authenticate, roleGuard('staff'), upload.single('image'), productController.createProduct);
router.put('/:id', authenticate, roleGuard('staff'), upload.single('image'), productController.updateProduct);
router.delete('/:id', authenticate, roleGuard('staff'), productController.deleteProduct);

module.exports = router;
