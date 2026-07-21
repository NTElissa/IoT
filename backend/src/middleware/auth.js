import jwt from 'jsonwebtoken';
import env from '../config/env.js';
import User from '../models/User.js';
import { failure } from '../utils/apiResponse.js';

export const protect = async (req, res, next) => {
  let token;
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  if (!token) {
    return failure(res, { message: 'Not authorized, no token provided', status: 401 });
  }

  try {
    const decoded = jwt.verify(token, env.jwtSecret);
    const user = await User.findById(decoded.id);
    if (!user || !user.isActive) {
      return failure(res, { message: 'User not found or deactivated', status: 401 });
    }
    req.user = user;
    next();
  } catch (err) {
    return failure(res, { message: 'Not authorized, invalid or expired token', status: 401 });
  }
};

// Restrict a route to one or more roles
export const authorize = (...roles) => (req, res, next) => {
  if (!req.user) {
    return failure(res, { message: 'Not authorized', status: 401 });
  }
  if (!roles.includes(req.user.role)) {
    return failure(res, {
      message: `Role '${req.user.role}' is not permitted to perform this action`,
      status: 403,
    });
  }
  next();
};

export default { protect, authorize };
