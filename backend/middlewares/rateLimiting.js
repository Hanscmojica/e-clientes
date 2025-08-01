// middlewares/rateLimiting.js
// Rate limiting middleware for security

const rateLimit = require('express-rate-limit');

// General rate limiting for all API endpoints
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: {
        success: false,
        message: 'Too many requests from this IP, please try again later.',
        retryAfter: 15 * 60 // 15 minutes in seconds
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    skip: (req) => {
        // Skip rate limiting for local development
        if (process.env.NODE_ENV === 'development') {
            const ip = req.ip || req.connection.remoteAddress;
            return ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1';
        }
        return false;
    }
});

// Strict rate limiting for authentication endpoints
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 login attempts per windowMs
    message: {
        success: false,
        message: 'Too many login attempts from this IP, please try again after 15 minutes.',
        retryAfter: 15 * 60
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true, // Don't count successful requests
    skip: (req) => {
        // Skip rate limiting for local development
        if (process.env.NODE_ENV === 'development') {
            const ip = req.ip || req.connection.remoteAddress;
            return ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1';
        }
        return false;
    }
});

// Very strict rate limiting for password change endpoints
const passwordChangeLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // limit each IP to 3 password change attempts per hour
    message: {
        success: false,
        message: 'Too many password change attempts from this IP, please try again after 1 hour.',
        retryAfter: 60 * 60
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
        if (process.env.NODE_ENV === 'development') {
            const ip = req.ip || req.connection.remoteAddress;
            return ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1';
        }
        return false;
    }
});

// Rate limiting for admin endpoints
const adminLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50, // limit each IP to 50 admin requests per windowMs
    message: {
        success: false,
        message: 'Too many admin requests from this IP, please try again later.',
        retryAfter: 15 * 60
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
        if (process.env.NODE_ENV === 'development') {
            const ip = req.ip || req.connection.remoteAddress;
            return ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1';
        }
        return false;
    }
});

module.exports = {
    generalLimiter,
    authLimiter,
    passwordChangeLimiter,
    adminLimiter
};