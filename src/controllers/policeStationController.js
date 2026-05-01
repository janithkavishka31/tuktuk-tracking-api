const policeStationService = require('../services/policeStationService');

async function getPoliceStations(req, res) {
  try {
    const data = await policeStationService.getPoliceStations(req.user);
    return res.status(200).json({
      message: 'Police stations retrieved successfully',
      data,
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      message: error.message || 'Failed to retrieve police stations',
    });
  }
}

async function getPoliceStationById(req, res) {
  try {
    const data = await policeStationService.getPoliceStationById(req.params.id, req.user);
    return res.status(200).json({
      message: 'Police station retrieved successfully',
      data,
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      message: error.message || 'Failed to retrieve police station',
    });
  }
}

async function createPoliceStation(req, res) {
  try {
    const data = await policeStationService.createPoliceStation(req.body);
    return res.status(201).json({
      message: 'Police station created successfully',
      data,
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      message: error.message || 'Failed to create police station',
    });
  }
}

async function updatePoliceStation(req, res) {
  try {
    const data = await policeStationService.updatePoliceStation(req.params.id, req.body, req.user);
    return res.status(200).json({
      message: 'Police station updated successfully',
      data,
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      message: error.message || 'Failed to update police station',
    });
  }
}

async function deletePoliceStation(req, res) {
  try {
    const data = await policeStationService.deletePoliceStation(req.params.id);
    return res.status(200).json({
      message: 'Police station deleted successfully',
      data,
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      message: error.message || 'Failed to delete police station',
    });
  }
}

module.exports = {
  getPoliceStations,
  getPoliceStationById,
  createPoliceStation,
  updatePoliceStation,
  deletePoliceStation,
};
