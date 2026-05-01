const express = require('express');
const locationController = require('../controllers/locationController');
const { authenticateToken } = require('../middleware/authMiddleware');

const router = express.Router();

// Add new location (Protected)
router.post('/', authenticateToken, locationController.addLocation);

// Get last known location
router.get('/live', locationController.getLastLocation);

// Get all live locations for all TukTuks
router.get('/live/all', locationController.getLiveLocations);

// Get location history
router.get('/history', locationController.getLocationHistory);

module.exports = router;
