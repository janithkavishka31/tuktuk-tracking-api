const jwt = require('jsonwebtoken');

const ROLE_PERMISSIONS = {
  ADMIN: [
    'tuktuk:create',
    'location:create',
    'policeStation:read',
    'policeStation:create',
    'policeStation:update',
    'policeStation:delete',
  ],
  POLICE: ['location:create', 'policeStation:read', 'policeStation:update'],
};

function mapRoleToPermissions(role) {
  return ROLE_PERMISSIONS[role] || [];
}

function mapJwtRoleToPermissions(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  req.user.permissions = mapRoleToPermissions(req.user.role);
  return next();
}

function authorizePermissions(...requiredPermissions) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const permissions = req.user.permissions || mapRoleToPermissions(req.user.role);
    const hasAllPermissions = requiredPermissions.every((permission) => permissions.includes(permission));

    if (!hasAllPermissions) {
      return res.status(403).json({ message: 'Forbidden: insufficient permissions' });
    }

    return next();
  };
}

function extractBearerToken(req) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return null;
  }

  return token;
}

function verifyUserToken(req) {
  const token = extractBearerToken(req);

  if (!token) {
    return null;
  }

  const secret = process.env.JWT_SECRET;

  if (!secret) {
    const error = new Error('JWT_SECRET is not configured');
    error.statusCode = 500;
    throw error;
  }

  const decoded = jwt.verify(token, secret);

  req.user = {
    id: decoded.sub,
    email: decoded.email,
    role: decoded.role,
    policeStationId: decoded.policeStationId || null,
    permissions: mapRoleToPermissions(decoded.role),
  };

  return req.user;
}

function authenticateUserOrDevice(req, res, next) {
  try {
    const user = verifyUserToken(req);

    if (user) {
      req.authContext = { type: 'user' };
      return next();
    }

    const apiKey = req.headers['x-device-api-key'];
    const expectedApiKey = process.env.DEVICE_API_KEY;

    if (expectedApiKey && apiKey && apiKey === expectedApiKey) {
      req.authContext = { type: 'device' };
      return next();
    }

    return res
      .status(401)
      .json({ message: 'Authentication required: provide user JWT or valid device API key' });
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

function allowPoliceOrDeviceForLocationCreate(req, res, next) {
  if (req.authContext?.type === 'device') {
    return next();
  }

  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  if (req.user.role !== 'POLICE') {
    return res.status(403).json({ message: 'Forbidden: POLICE access required' });
  }

  return next();
}

module.exports = {
  mapJwtRoleToPermissions,
  authorizePermissions,
  authenticateUserOrDevice,
  allowPoliceOrDeviceForLocationCreate,
  mapRoleToPermissions,
};
