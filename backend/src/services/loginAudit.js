import LoginEvent from '../models/LoginEvent.js';

export const recordLoginEvent = async (req, { user, email, success, method, reason }) => {
  try {
    await LoginEvent.create({
      hospital: user?.hospital || null,
      user: user?._id || null,
      email: (email || user?.email || '').toLowerCase(),
      success,
      method,
      reason,
      ip: req.ip || req.headers['x-forwarded-for'] || req.socket?.remoteAddress,
      userAgent: req.headers['user-agent'],
    });
  } catch (err) {
    // Never let audit logging break the login flow itself.
    console.error('[login-audit] failed to record event:', err.message);
  }
};

export default recordLoginEvent;
