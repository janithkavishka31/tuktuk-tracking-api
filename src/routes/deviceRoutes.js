const express = require('express');
const { body, param } = require('express-validator');

const deviceController = require('../controllers/deviceController');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');
const { validateRequest } = require('../middleware/validation');

const router = express.Router();

const idParam = [param('id').trim().notEmpty().withMessage('id is required'), validateRequest];

const createValidator = [
  body('tuktukId').trim().notEmpty().withMessage('tuktukId is required'),
  validateRequest,
];

router.post(
  '/',
  authenticateToken,
  authorizeRoles('SUPER_ADMIN', 'PROVINCE_ADMIN', 'DISTRICT_ADMIN', 'STATION_ADMIN'),
  createValidator,
  deviceController.createDevice,
);

router.post(
  '/:id/rotate',
  idParam,
  authenticateToken,
  authorizeRoles('SUPER_ADMIN', 'PROVINCE_ADMIN', 'DISTRICT_ADMIN', 'STATION_ADMIN'),
  deviceController.rotateDevice,
);

router.post(
  '/:id/revoke',
  idParam,
  authenticateToken,
  authorizeRoles('SUPER_ADMIN', 'PROVINCE_ADMIN', 'DISTRICT_ADMIN', 'STATION_ADMIN'),
  deviceController.revokeDevice,
);

module.exports = router;
