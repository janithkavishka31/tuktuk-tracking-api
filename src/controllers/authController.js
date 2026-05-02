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

async function logout(req, res) {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        message: 'Authorization header missing or invalid',
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    const result = await authService.logoutUser(token);

    return res.status(200).json(result);
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      message: error.message || 'Failed to logout',
    });
  }
}

module.exports = {
  login,
  me,
  logout,
};
