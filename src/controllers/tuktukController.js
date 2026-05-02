const tuktukService = require('../services/tuktukService');

async function createTukTuk(req, res) {
  try {
    const result = await tuktukService.createTukTuk(req.user, req.body);
    return res.status(201).json({
      message: 'TukTuk created successfully',
      data: result,
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      message: error.message || 'Failed to create TukTuk',
    });
  }
}

async function getAllTukTuks(req, res) {
  try {
    const { page = 1, limit = 20 } = req.query;

    const results = await tuktukService.getAllTukTuks(req.user, {
      page,
      limit,
    });
    return res.status(200).json({
      message: 'TukTuks retrieved successfully',
      data: results.data,
      meta: results.meta,
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      message: error.message || 'Failed to retrieve TukTuks',
    });
  }
}

async function getFilteredTukTuks(req, res) {
  try {
    const {
      provinceId,
      districtId,
      policeStationId,
      page = 1,
      limit = 20,
    } = req.query;

    const results = await tuktukService.getFilteredTukTuks(req.user, {
      provinceId,
      districtId,
      policeStationId,
      page,
      limit,
    });

    return res.status(200).json({
      message: 'Filtered TukTuks retrieved successfully',
      data: results.data,
      meta: results.meta,
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      message: error.message || 'Failed to retrieve filtered TukTuks',
    });
  }
}

async function getTukTukById(req, res) {
  try {
    const { id } = req.params;
    const result = await tuktukService.getTukTukById(req.user, id);
    return res.status(200).json({
      message: 'TukTuk retrieved successfully',
      data: result,
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      message: error.message || 'Failed to retrieve TukTuk',
    });
  }
}

async function updateTukTuk(req, res) {
  try {
    const result = await tuktukService.updateTukTuk(req.user, req.params.id, req.body);
    return res.status(200).json({
      message: 'TukTuk updated successfully',
      data: result,
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      message: error.message || 'Failed to update TukTuk',
    });
  }
}

async function deleteTukTuk(req, res) {
  try {
    const result = await tuktukService.deleteTukTuk(req.user, req.params.id);
    return res.status(200).json({
      message: 'TukTuk deleted successfully',
      data: result,
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      message: error.message || 'Failed to delete TukTuk',
    });
  }
}

module.exports = {
  createTukTuk,
  deleteTukTuk,
  getAllTukTuks,
  getFilteredTukTuks,
  getTukTukById,
  updateTukTuk,
};
