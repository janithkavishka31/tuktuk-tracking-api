const express = require('express');
const { body, query } = require('express-validator');
const locationController = require('../controllers/locationController');
const {
	authenticateUserOrDevice,
	allowPoliceOrDeviceForLocationCreate,
} = require('../middleware/authorize');
const { validateRequest } = require('../middleware/validation');

const router = express.Router();

const addLocationValidator = [
	body('tuktukId').trim().notEmpty().withMessage('tuktukId is required'),
	body('latitude')
		.notEmpty()
		.withMessage('latitude is required')
		.isFloat({ min: -90, max: 90 })
		.withMessage('latitude must be between -90 and 90'),
	body('longitude')
		.notEmpty()
		.withMessage('longitude is required')
		.isFloat({ min: -180, max: 180 })
		.withMessage('longitude must be between -180 and 180'),
	body('speed').optional().isFloat({ min: 0 }).withMessage('speed must be >= 0'),
	body('heading').optional().isFloat({ min: 0, max: 360 }).withMessage('heading must be 0-360'),
	body('accuracy').optional().isFloat({ min: 0 }).withMessage('accuracy must be >= 0'),
	body('altitude').optional().isFloat().withMessage('altitude must be a number'),
	validateRequest,
];

const lastLocationValidator = [
	query('tuktukId').optional().trim().notEmpty().withMessage('tuktukId cannot be empty'),
	query('provinceId').optional().trim().notEmpty().withMessage('provinceId cannot be empty'),
	query('districtId').optional().trim().notEmpty().withMessage('districtId cannot be empty'),
	validateRequest,
];

const historyValidator = [
	query('tuktukId').optional().trim().notEmpty().withMessage('tuktukId cannot be empty'),
	query('provinceId').optional().trim().notEmpty().withMessage('provinceId cannot be empty'),
	query('districtId').optional().trim().notEmpty().withMessage('districtId cannot be empty'),
	query('hours').optional().isInt({ min: 1, max: 168 }).withMessage('hours must be 1-168'),
	query('page').optional().isInt({ min: 1 }).withMessage('page must be a positive integer'),
	query('limit').optional().isInt({ min: 1, max: 500 }).withMessage('limit must be 1-500'),
	validateRequest,
];

const liveLocationsValidator = [
	query('provinceId').optional().trim().notEmpty().withMessage('provinceId cannot be empty'),
	query('districtId').optional().trim().notEmpty().withMessage('districtId cannot be empty'),
	query('page').optional().isInt({ min: 1 }).withMessage('page must be a positive integer'),
	query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit must be 1-100'),
	validateRequest,
];

// Add new location (Protected)
router.post(
	'/',
	authenticateUserOrDevice,
	allowPoliceOrDeviceForLocationCreate,
	addLocationValidator,
	locationController.addLocation,
);

// Get last known location
router.get('/live', lastLocationValidator, locationController.getLastLocation);

// Get all live locations for all TukTuks
router.get('/live/all', liveLocationsValidator, locationController.getLiveLocations);

// Get location history
router.get('/history', historyValidator, locationController.getLocationHistory);

module.exports = router;
