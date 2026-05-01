const express = require('express');
const { body } = require('express-validator');

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

router.post(
  '/',
  authenticateToken,
  authorizeRoles('SUPER_ADMIN', 'PROVINCE_ADMIN', 'DISTRICT_ADMIN', 'STATION_ADMIN'),
  createUserValidator,
  userController.createUser,
);

module.exports = router;
