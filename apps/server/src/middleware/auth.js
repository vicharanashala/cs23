const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/env');
const ApiError = require('../utils/ApiError');

/**
 * verifyAdmin — Express middleware that checks for a valid admin JWT.
 * Usage: router.use('/admin', verifyAdmin);
 *
 * Expects: Authorization: Bearer <token> header
 * On failure: throws ApiError 401
 */
function verifyAdmin(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new ApiError(401, 'Authorization header missing or malformed');
  }

  const token = authHeader.slice(7); // strip "Bearer "

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    if (payload.role !== 'admin') {
      throw new ApiError(403, 'Admin access required');
    }
    req.admin = payload; // attach decoded token to request
    next();
  } catch (err) {
    if (err instanceof ApiError) throw err;
    if (err.name === 'TokenExpiredError') {
      throw new ApiError(401, 'Token expired — please log in again');
    }
    throw new ApiError(401, 'Invalid token');
  }
}

/**
 * signAdminToken — creates a signed JWT for an admin user.
 * Used by the auth routes; not called by verifyAdmin directly.
 */
function signAdminToken(admin) {
  return jwt.sign(
    { sub: admin._id.toString(), email: admin.email, role: 'admin' },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

module.exports = { verifyAdmin, signAdminToken };