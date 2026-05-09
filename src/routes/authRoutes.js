const express = require('express');
const { body } = require('express-validator');

const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { validateRequest } = require('../middleware/validation');

const router = express.Router();

const loginValidator = [
  body('email').trim().isEmail().withMessage('email must be a valid email address'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('password must be at least 8 characters long'),
  validateRequest,
];

router.post('/login', loginValidator, authController.login);
router.get('/me', authenticateToken, authController.me);
router.post('/logout', authenticateToken, authController.logout);

module.exports = router;
