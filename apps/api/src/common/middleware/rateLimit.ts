import rateLimit from 'express-rate-limit';

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // limit each IP to 50 auth requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many login attempts. Please try again after 15 minutes.' },
});

export const generalRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 300, // 300 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Request rate limit exceeded. Please slow down.' },
});

export const exportRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20, // 20 exports per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Export limit reached. Please wait before generating another report.' },
});
