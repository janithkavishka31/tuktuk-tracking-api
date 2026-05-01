const express = require('express');
const { body, param } = require('express-validator');

const policeStationController = require('../controllers/policeStationController');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');
const { mapJwtRoleToPermissions, authorizePermissions } = require('../middleware/authorize');
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

router.get(
  '/',
  authenticateToken,
  mapJwtRoleToPermissions,
  authorizePermissions('policeStation:read'),
  policeStationController.getPoliceStations,
);

router.get(
  '/:id',
  stationIdParamValidator,
  authenticateToken,
  mapJwtRoleToPermissions,
  authorizePermissions('policeStation:read'),
  policeStationController.getPoliceStationById,
);

router.post(
  '/',
  authenticateToken,
  authorizeRoles('ADMIN'),
  createPoliceStationValidator,
  policeStationController.createPoliceStation,
);

router.put(
  '/:id',
  stationIdParamValidator,
  authenticateToken,
  mapJwtRoleToPermissions,
  authorizePermissions('policeStation:update'),
  updatePoliceStationValidator,
  policeStationController.updatePoliceStation,
);

router.delete(
  '/:id',
  stationIdParamValidator,
  authenticateToken,
  authorizeRoles('ADMIN'),
  policeStationController.deletePoliceStation,
);

module.exports = router;
