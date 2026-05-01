const express = require('express');
const tuktukController = require('../controllers/tuktukController');
const { authenticateToken } = require('../middleware/authMiddleware');

const router = express.Router();

// Create TukTuk (Protected)
router.post('/', authenticateToken, tuktukController.createTukTuk);

// Get all TukTuks
router.get('/', tuktukController.getAllTukTuks);

// Get TukTuk by ID
router.get('/:id', tuktukController.getTukTukById);

module.exports = router;
