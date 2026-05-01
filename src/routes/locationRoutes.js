const express = require('express');
const { body, query } = require('express-validator');
const locationController = require('../controllers/locationController');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');
const { authenticateDevice } = require('../middleware/deviceAuth');
const { applyScopeFilter } = require('../middleware/scopeMiddleware');
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

const liveValidator = [
  query('tuktukId').optional().trim().notEmpty().withMessage('tuktukId cannot be empty'),
  query('page').optional().isInt({ min: 1 }).withMessage('page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit must be 1-100'),
  validateRequest,
];

const historyValidator = [
  query('tuktukId').optional().trim().notEmpty().withMessage('tuktukId cannot be empty'),
  query('from').optional().isISO8601().withMessage('from must be a valid ISO 8601 date'),
  query('to').optional().isISO8601().withMessage('to must be a valid ISO 8601 date'),
  query('page').optional().isInt({ min: 1 }).withMessage('page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 500 }).withMessage('limit must be 1-500'),
  validateRequest,
];

router.post('/', authenticateDevice, addLocationValidator, locationController.addLocation);

router.get(
  '/live',
  authenticateToken,
  authorizeRoles(
    'SUPER_ADMIN',
    'PROVINCE_ADMIN',
    'DISTRICT_ADMIN',
    'STATION_ADMIN',
    'POLICE',
  ),
  applyScopeFilter,
  liveValidator,
  locationController.getLiveLocations,
);

router.get(
  '/history',
  authenticateToken,
  authorizeRoles(
    'SUPER_ADMIN',
    'PROVINCE_ADMIN',
    'DISTRICT_ADMIN',
    'STATION_ADMIN',
    'POLICE',
  ),
  applyScopeFilter,
  historyValidator,
  locationController.getLocationHistory,
);

module.exports = router;
