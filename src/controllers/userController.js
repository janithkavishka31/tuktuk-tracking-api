const userService = require('../services/userService');

async function createUser(req, res) {
  try {
    const result = await userService.createUser(req.user, req.body);
    return res.status(201).json({
      message: 'User created successfully',
      ...result,
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      message: error.message || 'Failed to create user',
    });
  }
}

module.exports = {
  createUser,
};
