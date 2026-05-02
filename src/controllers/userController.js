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

async function updateUser(req, res) {
  try {
    const result = await userService.updateUser(req.user, req.params.id, req.body);
    return res.status(200).json({
      message: 'User updated successfully',
      ...result,
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      message: error.message || 'Failed to update user',
    });
  }
}

async function getUsers(req, res) {
  try {
    const result = await userService.getUsers(req.user);
    return res.status(200).json({
      message: 'Users retrieved successfully',
      ...result,
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      message: error.message || 'Failed to retrieve users',
    });
  }
}

async function getUserById(req, res) {
  try {
    const result = await userService.getUserById(req.user, req.params.id);
    return res.status(200).json({
      message: 'User retrieved successfully',
      ...result,
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      message: error.message || 'Failed to retrieve user',
    });
  }
}

async function deleteUser(req, res) {
  try {
    const result = await userService.deleteUser(req.user, req.params.id);
    return res.status(200).json({
      message: 'User deleted successfully',
      ...result,
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      message: error.message || 'Failed to delete user',
    });
  }
}

module.exports = {
  createUser,
  deleteUser,
  getUserById,
  getUsers,
  updateUser,
};
