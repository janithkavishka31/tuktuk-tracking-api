const express = require('express');
const { body, param, query } = require('express-validator');
const tuktukController = require('../controllers/tuktukController');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');
const { validateRequest } = require('../middleware/validation');

const router = express.Router();

const registrationPattern = /^[A-Z0-9-]{3,20}$/;

const createTukTukValidator = [
	body('registrationNo')
		.trim()
		.notEmpty()
		.withMessage('registrationNo is required')
		.customSanitizer((value) => String(value).toUpperCase())
		.matches(registrationPattern)
		.withMessage('registrationNo must match pattern ^[A-Z0-9-]{3,20}$'),
	body('policeStationId').trim().notEmpty().withMessage('policeStationId is required'),
	validateRequest,
];

const getAllTukTuksValidator = [
	query('page').optional().isInt({ min: 1 }).withMessage('page must be a positive integer'),
	query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit must be 1-100'),
	validateRequest,
];

const idParamValidator = [param('id').trim().notEmpty().withMessage('id is required'), validateRequest];

// Create TukTuk (Protected)
router.post(
	'/',
	authenticateToken,
	authorizeRoles('ADMIN'),
	createTukTukValidator,
	tuktukController.createTukTuk,
);

// Get all TukTuks
router.get('/', getAllTukTuksValidator, tuktukController.getAllTukTuks);

// Get TukTuk by ID
router.get('/:id', idParamValidator, tuktukController.getTukTukById);

module.exports = router;
