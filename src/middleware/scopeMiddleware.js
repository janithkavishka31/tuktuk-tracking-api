const { tukTukWhereForUser } = require('../utils/scope');

/**
 * Attaches req.tukTukScope from the authenticated user's role and jurisdiction.
 * Use after authenticateToken on routes that filter by geographic / org scope.
 */
function applyScopeFilter(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  req.tukTukScope = tukTukWhereForUser(req.user);
  return next();
}

module.exports = {
  applyScopeFilter,
};
