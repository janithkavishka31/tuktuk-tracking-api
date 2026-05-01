const authService = require('../services/authService');

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

module.exports = {
  login,
  me,
};
