const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const { authenticateToken } = require('../middlewares/authMiddleware');

// Settings are sensitive; require authenticated admin access.
router.use(authenticateToken);

router.get('/', settingsController.getSettings);
router.put('/', settingsController.updateSettings);

module.exports = router;
