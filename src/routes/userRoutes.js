const express = require('express');
const { body, param } = require('express-validator');

const userController = require('../controllers/userController');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');
const { CREATABLE_ROLES } = require('../constants/roles');
const { validateRequest } = require('../middleware/validation');

const router = express.Router();

function policeScopeValidator(req, res, next) {
  const { role, stationId, districtId, provinceId } = req.body;
  const r = String(role || '')
    .trim()
    .toUpperCase();

  if (r !== 'POLICE') {
    return next();
  }

  const scopes = [stationId, districtId, provinceId].filter(
    (value) => value !== undefined && value !== null && String(value).trim() !== '',
  );

  if (scopes.length !== 1) {
    return res.status(400).json({
      message: 'POLICE users require exactly one of stationId, districtId, or provinceId',
    });
  }

  return next();
}

function policeUpdateScopeValidator(req, res, next) {
  const { role, stationId, districtId, provinceId } = req.body;
  const r = String(role || '')
    .trim()
    .toUpperCase();

  if (r !== 'POLICE') {
    return next();
  }

  const scopes = [stationId, districtId, provinceId].filter(
    (value) => value !== undefined && value !== null && String(value).trim() !== '',
  );

  if (scopes.length > 1) {
    return res.status(400).json({
      message: 'POLICE users can only keep or set one of stationId, districtId, or provinceId',
    });
  }

  return next();
}

const idParamValidator = [param('id').trim().notEmpty().withMessage('id is required'), validateRequest];

const createUserValidator = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('name must be 2 to 100 characters'),
  body('email').trim().isEmail().withMessage('email must be a valid email address'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('password must be at least 8 characters long'),
  body('role')
    .trim()
    .isIn(CREATABLE_ROLES)
    .withMessage(`role must be one of: ${CREATABLE_ROLES.join(', ')}`),
  body('provinceId').optional({ nullable: true }).isString().trim().notEmpty(),
  body('districtId').optional({ nullable: true }).isString().trim().notEmpty(),
  body('stationId').optional({ nullable: true }).isString().trim().notEmpty(),
  validateRequest,
  policeScopeValidator,
];

const updateUserValidator = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('name must be 2 to 100 characters'),
  body('email').optional().trim().isEmail().withMessage('email must be a valid email address'),
  body('password')
    .optional()
    .isLength({ min: 8 })
    .withMessage('password must be at least 8 characters long'),
  body('role')
    .optional()
    .trim()
    .isIn(CREATABLE_ROLES)
    .withMessage(`role must be one of: ${CREATABLE_ROLES.join(', ')}`),
  body('provinceId').optional({ nullable: true }).isString().trim().notEmpty(),
  body('districtId').optional({ nullable: true }).isString().trim().notEmpty(),
  body('stationId').optional({ nullable: true }).isString().trim().notEmpty(),
  validateRequest,
  policeUpdateScopeValidator,
];

router.post(
  '/',
  authenticateToken,
  authorizeRoles('SUPER_ADMIN', 'PROVINCE_ADMIN', 'DISTRICT_ADMIN', 'STATION_ADMIN'),
  createUserValidator,
  userController.createUser,
);

router.put(
  '/:id',
  authenticateToken,
  authorizeRoles('SUPER_ADMIN', 'PROVINCE_ADMIN', 'DISTRICT_ADMIN', 'STATION_ADMIN'),
  idParamValidator,
  updateUserValidator,
  userController.updateUser,
);

router.get(
  '/',
  authenticateToken,
  authorizeRoles('SUPER_ADMIN', 'PROVINCE_ADMIN', 'DISTRICT_ADMIN', 'STATION_ADMIN'),
  userController.getUsers,
);

router.get(
  '/:id',
  authenticateToken,
  authorizeRoles('SUPER_ADMIN', 'PROVINCE_ADMIN', 'DISTRICT_ADMIN', 'STATION_ADMIN'),
  idParamValidator,
  userController.getUserById,
);

router.delete(
  '/:id',
  authenticateToken,
  authorizeRoles('SUPER_ADMIN', 'PROVINCE_ADMIN', 'DISTRICT_ADMIN', 'STATION_ADMIN'),
  idParamValidator,
  userController.deleteUser,
);

module.exports = router;
