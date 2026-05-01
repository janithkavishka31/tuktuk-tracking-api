const deviceService = require('../services/deviceService');

async function createDevice(req, res) {
  try {
    const result = await deviceService.createDevice(req.user, req.body);
    return res.status(201).json({
      message: 'Device registered successfully',
      data: result.device,
      apiKey: result.apiKey,
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      message: error.message || 'Failed to create device',
    });
  }
}

async function rotateDevice(req, res) {
  try {
    const result = await deviceService.rotateDeviceKey(req.user, req.params.id);
    return res.status(200).json({
      message: 'API key rotated successfully',
      data: result.device,
      apiKey: result.apiKey,
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      message: error.message || 'Failed to rotate API key',
    });
  }
}

async function revokeDevice(req, res) {
  try {
    const result = await deviceService.revokeDevice(req.user, req.params.id);
    return res.status(200).json({
      message: 'Device revoked successfully',
      data: result,
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      message: error.message || 'Failed to revoke device',
    });
  }
}

module.exports = {
  createDevice,
  revokeDevice,
  rotateDevice,
};
