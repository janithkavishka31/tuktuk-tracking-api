const tuktukService = require('../services/tuktukService');

async function createTukTuk(req, res) {
  try {
    const result = await tuktukService.createTukTuk(req.body);
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
    const { page = 1, limit = 20, provinceId, districtId } = req.query;

    const results = await tuktukService.getAllTukTuks({
      page,
      limit,
      provinceId,
      districtId,
    });
    return res.status(200).json({
      message: 'TukTuks retrieved successfully',
      data: results,
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      message: error.message || 'Failed to retrieve TukTuks',
    });
  }
}

async function getTukTukById(req, res) {
  try {
    const { id } = req.params;
    const result = await tuktukService.getTukTukById(id);
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

module.exports = {
  createTukTuk,
  getAllTukTuks,
  getTukTukById,
};
