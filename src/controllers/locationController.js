const locationService = require('../services/locationService');

async function addLocation(req, res) {
  try {
    const result = await locationService.addLocation(req.body);
    return res.status(201).json({
      message: 'Location added successfully',
      data: result,
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      message: error.message || 'Failed to add location',
    });
  }
}

async function getLastLocation(req, res) {
  try {
    const { tuktukId } = req.query;
    const result = await locationService.getLastLocationForTukTuk(tuktukId);
    return res.status(200).json({
      message: 'Last location retrieved successfully',
      data: result,
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      message: error.message || 'Failed to retrieve last location',
    });
  }
}

async function getLocationHistory(req, res) {
  try {
    const { tuktukId, hours = 24, skip = 0, take = 50 } = req.query;
    const results = await locationService.getLocationHistory({
      tuktukId,
      hours: parseInt(hours),
      skip,
      take,
    });
    return res.status(200).json({
      message: 'Location history retrieved successfully',
      data: results,
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      message: error.message || 'Failed to retrieve location history',
    });
  }
}

async function getLiveLocations(req, res) {
  try {
    const results = await locationService.getLiveLocations();
    return res.status(200).json({
      message: 'Live locations retrieved successfully',
      data: results,
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      message: error.message || 'Failed to retrieve live locations',
    });
  }
}

module.exports = {
  addLocation,
  getLastLocation,
  getLocationHistory,
  getLiveLocations,
};
