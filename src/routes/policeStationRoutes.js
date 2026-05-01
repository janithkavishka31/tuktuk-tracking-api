const express = require('express');
const { body, param } = require('express-validator');

const policeStationController = require('../controllers/policeStationController');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');
const { validateRequest } = require('../middleware/validation');

const router = express.Router();

const stationIdParamValidator = [
  param('id').trim().notEmpty().withMessage('id is required'),
  validateRequest,
];

const createPoliceStationValidator = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('name is required')
    .isLength({ min: 3, max: 120 })
    .withMessage('name must be 3 to 120 characters'),
  body('districtId').trim().notEmpty().withMessage('districtId is required'),
  validateRequest,
];

const updatePoliceStationValidator = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 3, max: 120 })
    .withMessage('name must be 3 to 120 characters'),
  body('districtId').optional().trim().notEmpty().withMessage('districtId cannot be empty'),
  validateRequest,
];

const readerRoles = [
  'SUPER_ADMIN',
  'PROVINCE_ADMIN',
  'DISTRICT_ADMIN',
  'STATION_ADMIN',
  'POLICE',
];

router.get(
  '/',
  authenticateToken,
  authorizeRoles(...readerRoles),
  policeStationController.getPoliceStations,
);

router.get(
  '/:id',
  stationIdParamValidator,
  authenticateToken,
  authorizeRoles(...readerRoles),
  policeStationController.getPoliceStationById,
);

router.post(
  '/',
  authenticateToken,
  authorizeRoles('SUPER_ADMIN'),
  createPoliceStationValidator,
  policeStationController.createPoliceStation,
);

router.put(
  '/:id',
  stationIdParamValidator,
  authenticateToken,
  authorizeRoles('SUPER_ADMIN'),
  updatePoliceStationValidator,
  policeStationController.updatePoliceStation,
);

router.delete(
  '/:id',
  stationIdParamValidator,
  authenticateToken,
  authorizeRoles('SUPER_ADMIN'),
  policeStationController.deletePoliceStation,
);

module.exports = router;
