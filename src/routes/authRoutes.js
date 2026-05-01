const express = require('express');
const { body } = require('express-validator');

const authController = require('../controllers/authController');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');
const { validateRequest } = require('../middleware/validation');

const router = express.Router();

const registerValidator = [
	body('fullName')
		.trim()
		.notEmpty()
		.withMessage('fullName is required')
		.isLength({ min: 2, max: 100 })
		.withMessage('fullName must be 2 to 100 characters'),
	body('email').trim().isEmail().withMessage('email must be a valid email address'),
	body('password')
		.isLength({ min: 8 })
		.withMessage('password must be at least 8 characters long'),
	body('role').trim().isIn(['ADMIN', 'POLICE']).withMessage('role must be ADMIN or POLICE'),
	body('policeStationId')
		.optional({ nullable: true })
		.trim()
		.notEmpty()
		.withMessage('policeStationId cannot be empty'),
	validateRequest,
];

const loginValidator = [
	body('email').trim().isEmail().withMessage('email must be a valid email address'),
	body('password')
		.isLength({ min: 8 })
		.withMessage('password must be at least 8 characters long'),
	validateRequest,
];

router.post('/register', registerValidator, authController.register);
router.post('/login', loginValidator, authController.login);
router.get('/me', authenticateToken, authController.me);
router.get('/admin', authenticateToken, authorizeRoles('ADMIN'), authController.adminOnly);

module.exports = router;