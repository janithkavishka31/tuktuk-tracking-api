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
    const { tuktukId, provinceId, districtId } = req.query;
    const result = await locationService.getLastLocationForTukTuk({
      tuktukId,
      provinceId,
      districtId,
    });
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
    const { tuktukId, provinceId, districtId, hours = 24, page = 1, limit = 20 } = req.query;

    const results = await locationService.getLocationHistory({
      tuktukId,
      provinceId,
      districtId,
      hours: parseInt(hours),
      page,
      limit,
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
    const { provinceId, districtId, page = 1, limit = 20 } = req.query;
    const results = await locationService.getLiveLocations({
      provinceId,
      districtId,
      page,
      limit,
    });
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
