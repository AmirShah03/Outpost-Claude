const router = require('express').Router();
const reportController = require('../controllers/report.controller');
const { authenticate } = require('../middleware/auth');
const { roleGuard } = require('../middleware/roleGuard');
const { validate } = require('../utils/validators');

router.use(authenticate, roleGuard('staff'));

router.get('/', reportController.getReports);
router.post('/generate', validate('generateReport'), reportController.generateReport);
router.get('/:id', reportController.getReportById);
router.put('/:id', validate('updateReport'), reportController.updateReport);
router.delete('/:id', reportController.deleteReport);
router.get('/:id/pdf', reportController.downloadPDF);

module.exports = router;
