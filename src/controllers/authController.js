const authService = require('../services/authService');

async function register(req, res) {
  try {
    const result = await authService.registerUser(req.body);
    return res.status(201).json({
      message: 'User registered successfully',
      ...result,
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      message: error.message || 'Failed to register user',
    });
  }
}

async function login(req, res) {
  try {
    const result = await authService.loginUser(req.body);
    return res.status(200).json({
      message: 'Login successful',
      ...result,
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      message: error.message || 'Failed to login',
    });
  }
}

async function me(req, res) {
  return res.status(200).json({
    message: 'Authenticated user',
    user: req.user,
  });
}

async function adminOnly(req, res) {
  return res.status(200).json({
    message: 'Admin access granted',
  });
}

module.exports = {
  adminOnly,
  login,
  me,
  register,
};