const locationService = require('../services/locationService');

async function addLocation(req, res) {
  try {
    const result = await locationService.addLocationForDevice(req.device, req.body);
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

async function getLiveLocations(req, res) {
  try {
    const { page = 1, limit = 20, tuktukId } = req.query;
    const results = await locationService.getLiveLocations({
      user: req.user,
      scope: req.tukTukScope,
      page,
      limit,
      tuktukId,
    });
    return res.status(200).json({
      message: 'Live locations retrieved successfully',
      data: results.data,
      meta: results.meta,
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      message: error.message || 'Failed to retrieve live locations',
    });
  }
}

async function getLocationHistory(req, res) {
  try {
    const { tuktukId, from, to, page = 1, limit = 20 } = req.query;

    const results = await locationService.getLocationHistory({
      user: req.user,
      scope: req.tukTukScope,
      tuktukId,
      from,
      to,
      page,
      limit,
    });
    return res.status(200).json({
      message: 'Location history retrieved successfully',
      data: results.data,
      meta: results.meta,
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      message: error.message || 'Failed to retrieve location history',
    });
  }
}

module.exports = {
  addLocation,
  getLiveLocations,
  getLocationHistory,
};
