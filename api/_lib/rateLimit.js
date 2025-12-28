/**
 * Basic In-Memory Rate Limiting
 * Note: In production with multiple instances, use Redis or similar
 */

// In-memory store for rate limiting
// Key: identifier (IP or userId), Value: { count, resetTime }
const rateLimitStore = new Map();

// Clean up old entries periodically
const CLEANUP_INTERVAL = 60000; // 1 minute
let lastCleanup = Date.now();

/**
 * Clean up expired rate limit entries
 */
function cleanupExpired() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  
  lastCleanup = now;
  for (const [key, value] of rateLimitStore.entries()) {
    if (now > value.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}

/**
 * Get client identifier from request
 * @param {Object} req - HTTP request object
 * @returns {string} Client identifier
 */
function getClientId(req) {
  // Try to get real IP from various headers (Vercel, Cloudflare, etc.)
  const forwarded = req.headers['x-forwarded-for'];
  const realIp = req.headers['x-real-ip'];
  const vercelIp = req.headers['x-vercel-forwarded-for'];
  
  if (vercelIp) return vercelIp.split(',')[0].trim();
  if (forwarded) return forwarded.split(',')[0].trim();
  if (realIp) return realIp;
  
  return 'unknown';
}

/**
 * Check rate limit for a client
 * @param {Object} req - HTTP request object
 * @param {Object} options - Rate limit options
 * @param {number} options.maxRequests - Maximum requests per window
 * @param {number} options.windowMs - Time window in milliseconds
 * @param {string} options.keyPrefix - Prefix for the rate limit key
 * @returns {Object} { allowed: boolean, remaining: number, resetTime: number }
 */
function checkRateLimit(req, options = {}) {
  cleanupExpired();
  
  const {
    maxRequests = 60,
    windowMs = 60000, // 1 minute default
    keyPrefix = 'global',
  } = options;
  
  const clientId = getClientId(req);
  const key = `${keyPrefix}:${clientId}`;
  const now = Date.now();
  
  let entry = rateLimitStore.get(key);
  
  // If no entry or window expired, create new entry
  if (!entry || now > entry.resetTime) {
    entry = {
      count: 0,
      resetTime: now + windowMs,
    };
  }
  
  entry.count++;
  rateLimitStore.set(key, entry);
  
  const allowed = entry.count <= maxRequests;
  const remaining = Math.max(0, maxRequests - entry.count);
  
  return {
    allowed,
    remaining,
    resetTime: entry.resetTime,
    retryAfter: Math.ceil((entry.resetTime - now) / 1000),
  };
}

/**
 * Rate limit middleware helper
 * Returns error response if rate limited, null otherwise
 * @param {Object} req - HTTP request object
 * @param {Object} res - HTTP response object  
 * @param {Object} options - Rate limit options
 * @returns {boolean} True if rate limited (response sent), false otherwise
 */
function rateLimit(req, res, options = {}) {
  const result = checkRateLimit(req, options);
  
  // Set rate limit headers
  res.setHeader('X-RateLimit-Remaining', result.remaining);
  res.setHeader('X-RateLimit-Reset', result.resetTime);
  
  if (!result.allowed) {
    res.setHeader('Retry-After', result.retryAfter);
    res.status(429).json({
      error: 'Too many requests',
      retryAfter: result.retryAfter,
    });
    return true;
  }
  
  return false;
}

/**
 * Stricter rate limit for sensitive operations (login, etc.)
 */
function strictRateLimit(req, res) {
  return rateLimit(req, res, {
    maxRequests: 10,
    windowMs: 60000, // 10 requests per minute
    keyPrefix: 'strict',
  });
}

/**
 * Standard rate limit for normal API calls
 */
function standardRateLimit(req, res) {
  return rateLimit(req, res, {
    maxRequests: 60,
    windowMs: 60000, // 60 requests per minute
    keyPrefix: 'standard',
  });
}

module.exports = {
  checkRateLimit,
  rateLimit,
  strictRateLimit,
  standardRateLimit,
  getClientId,
};
