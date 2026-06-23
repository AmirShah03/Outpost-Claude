const router = require('express').Router();

// ── Customer Routes ────────────────────────────────────────
router.get('/', (req, res) => {
  res.render('index', { title: 'Home', user: req.user || null });
});

router.get('/catalog', (req, res) => {
  res.render('catalog', { title: 'Shop', user: req.user || null });
});

router.get('/login', (req, res) => {
  res.render('login', { title: 'Login', user: req.user || null });
});

router.get('/cart', (req, res) => {
  res.render('cart', { title: 'Shopping Cart', user: req.user || null });
});

router.get('/orders', (req, res) => {
  res.render('orders', { title: 'My Orders', user: req.user || null });
});

router.get('/profile', (req, res) => {
  res.render('profile', { title: 'My Account', user: req.user || null });
});

// ── Staff Routes ───────────────────────────────────────────
router.get('/staff', (req, res) => {
  res.render('staff/dashboard', { title: 'Staff Dashboard', user: req.user || null });
});

router.get('/staff/orders', (req, res) => {
  res.render('staff/orders', { title: 'Manage Orders', user: req.user || null });
});

router.get('/staff/products', (req, res) => {
  res.render('staff/products', { title: 'Manage Products', user: req.user || null });
});

router.get('/staff/reports', (req, res) => {
  res.render('staff/reports', { title: 'Sales Reports', user: req.user || null });
});

router.get('/staff/cancellations', (req, res) => {
  res.render('staff/cancellations', { title: 'Cancellation Requests', user: req.user || null });
});

module.exports = router;
