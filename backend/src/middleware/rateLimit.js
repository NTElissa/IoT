import rateLimit from 'express-rate-limit';

// Slows down brute-force attempts against credential-checking endpoints.
// Keyed by IP; deliberately generous enough not to lock out a busy nursing
// station sharing one IP, but tight enough to blunt automated guessing.
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many attempts. Please wait a few minutes and try again.' },
});

// Tighter limiter specifically for the password-login endpoint, since that's
// the highest-value brute-force target.
export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many login attempts. Please wait a few minutes and try again.' },
});

export default { authRateLimiter, loginRateLimiter };
