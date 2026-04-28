const express = require('express');

const authController = require('../controllers/authController');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/me', authenticateToken, authController.me);
router.get('/admin', authenticateToken, authorizeRoles('ADMIN'), authController.adminOnly);

module.exports = router;