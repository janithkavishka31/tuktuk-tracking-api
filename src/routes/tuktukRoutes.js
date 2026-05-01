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

const updateTukTukValidator = [
  body('registrationNo')
    .optional()
    .trim()
    .customSanitizer((value) => String(value).toUpperCase())
    .matches(registrationPattern)
    .withMessage('registrationNo must match pattern ^[A-Z0-9-]{3,20}$'),
  body('policeStationId').optional().trim().notEmpty().withMessage('policeStationId cannot be empty'),
  validateRequest,
];

const getAllTukTuksValidator = [
  query('page').optional().isInt({ min: 1 }).withMessage('page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit must be 1-100'),
  validateRequest,
];

const idParamValidator = [param('id').trim().notEmpty().withMessage('id is required'), validateRequest];

const readRoles = [
  'SUPER_ADMIN',
  'PROVINCE_ADMIN',
  'DISTRICT_ADMIN',
  'STATION_ADMIN',
  'POLICE',
];

const writeRoles = ['SUPER_ADMIN', 'PROVINCE_ADMIN', 'DISTRICT_ADMIN', 'STATION_ADMIN'];

router.post(
  '/',
  authenticateToken,
  authorizeRoles(...writeRoles),
  createTukTukValidator,
  tuktukController.createTukTuk,
);

router.get('/', authenticateToken, authorizeRoles(...readRoles), getAllTukTuksValidator, tuktukController.getAllTukTuks);

router.get('/:id', idParamValidator, authenticateToken, authorizeRoles(...readRoles), tuktukController.getTukTukById);

router.put(
  '/:id',
  idParamValidator,
  authenticateToken,
  authorizeRoles(...writeRoles),
  updateTukTukValidator,
  tuktukController.updateTukTuk,
);

router.delete(
  '/:id',
  idParamValidator,
  authenticateToken,
  authorizeRoles(...writeRoles),
  tuktukController.deleteTukTuk,
);

module.exports = router;
