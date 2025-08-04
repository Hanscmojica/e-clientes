# SECURITY IMPROVEMENTS PROPOSAL

## 🚨 **CRITICAL SECURITY VULNERABILITIES IDENTIFIED**

### **1. IMMEDIATE RISKS:**
- **Hardcoded Credentials**: Passwords exposed in README file
- **Weak Authentication**: Basic password checks, no rate limiting
- **No Input Validation**: SQL injection and XSS vulnerabilities
- **Insecure Token Storage**: JWT tokens stored in localStorage
- **Missing HTTPS Enforcement**: Mixed content vulnerabilities
- **No Session Management**: Concurrent sessions not controlled
- **Exposed Internal Paths**: Debug information leakage

### **2. COMPLIANCE ISSUES:**
- No GDPR compliance measures
- Missing audit logging
- No data encryption at rest
- Inadequate access controls

## 🔒 **COMPREHENSIVE SECURITY IMPLEMENTATION**

### **1. AUTHENTICATION & AUTHORIZATION**

#### **Secure Password Management:**
```javascript
// backend/src/infrastructure/security/PasswordService.js
const bcrypt = require('bcryptjs');
const zxcvbn = require('zxcvbn');

class PasswordService {
  constructor() {
    this.saltRounds = 12;
    this.minScore = 3; // Strong password requirement
  }

  async hash(password) {
    // Validate password strength
    const strength = this.validateStrength(password);
    if (!strength.isValid) {
      throw new SecurityError('Password does not meet security requirements', {
        requirements: strength.requirements
      });
    }

    return await bcrypt.hash(password, this.saltRounds);
  }

  async verify(password, hash) {
    try {
      return await bcrypt.compare(password, hash);
    } catch (error) {
      // Log failed verification attempt
      console.error('Password verification failed:', error);
      return false;
    }
  }

  validateStrength(password) {
    const result = zxcvbn(password);
    const requirements = {
      minLength: password.length >= 12,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumbers: /\d/.test(password),
      hasSpecialChars: /[!@#$%^&*(),.?":{}|<>]/.test(password),
      noCommonPatterns: result.score >= this.minScore,
      notPreviouslyBreached: true // Implement with HaveIBeenPwned API
    };

    const isValid = Object.values(requirements).every(req => req);

    return {
      isValid,
      score: result.score,
      requirements,
      feedback: result.feedback,
      estimatedCrackTime: result.crack_times_display.offline_slow_hashing_1e4_per_second
    };
  }
}
```

#### **Enhanced JWT Token Service:**
```javascript
// backend/src/infrastructure/security/TokenService.js
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

class TokenService {
  constructor() {
    this.accessTokenExpiry = '15m';
    this.refreshTokenExpiry = '7d';
    this.issuer = 'e-clientes-api';
    this.audience = 'e-clientes-app';
  }

  generateTokenPair(user) {
    const jti = crypto.randomUUID();
    const sessionId = crypto.randomBytes(32).toString('hex');

    const accessToken = this.generateAccessToken(user, jti, sessionId);
    const refreshToken = this.generateRefreshToken(user, jti, sessionId);

    return {
      accessToken,
      refreshToken,
      expiresIn: this.accessTokenExpiry,
      sessionId,
      tokenType: 'Bearer'
    };
  }

  generateAccessToken(user, jti, sessionId) {
    const payload = {
      sub: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      permissions: user.permissions,
      clientId: user.clientId,
      sessionId: sessionId,
      type: 'access'
    };

    return jwt.sign(payload, process.env.JWT_ACCESS_SECRET, {
      expiresIn: this.accessTokenExpiry,
      issuer: this.issuer,
      audience: this.audience,
      jwtid: jti,
      algorithm: 'HS256'
    });
  }

  generateRefreshToken(user, jti, sessionId) {
    const payload = {
      sub: user.id,
      sessionId: sessionId,
      type: 'refresh'
    };

    return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
      expiresIn: this.refreshTokenExpiry,
      issuer: this.issuer,
      audience: this.audience,
      jwtid: jti,
      algorithm: 'HS256'
    });
  }

  verifyAccessToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_ACCESS_SECRET, {
        issuer: this.issuer,
        audience: this.audience,
        algorithms: ['HS256']
      });
    } catch (error) {
      throw new AuthenticationError('Invalid or expired access token');
    }
  }

  verifyRefreshToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_REFRESH_SECRET, {
        issuer: this.issuer,
        audience: this.audience,
        algorithms: ['HS256']
      });
    } catch (error) {
      throw new AuthenticationError('Invalid or expired refresh token');
    }
  }
}
```

#### **Rate Limiting & Brute Force Protection:**
```javascript
// backend/src/infrastructure/security/RateLimiter.js
const rateLimit = require('express-rate-limit');
const MongoStore = require('rate-limit-mongo');

class RateLimiter {
  static loginLimiter = rateLimit({
    store: new MongoStore({
      uri: process.env.DATABASE_URL,
      collectionName: 'rate_limits',
      expireTimeMs: 15 * 60 * 1000 // 15 minutes
    }),
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per window
    message: {
      error: 'Too many login attempts, please try again after 15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
    // Progressive delays
    onLimitReached: async (req, res, options) => {
      await this.logSecurityEvent('RATE_LIMIT_EXCEEDED', req);
    }
  });

  static apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per window
    message: {
      error: 'Too many API requests, please try again later'
    }
  });

  static strictLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 10, // 10 requests per minute for sensitive operations
    skipSuccessfulRequests: true
  });

  static async logSecurityEvent(event, req) {
    // Log to security monitoring system
    console.warn(`Security Event: ${event}`, {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString(),
      url: req.originalUrl
    });
  }
}
```

### **2. INPUT VALIDATION & SANITIZATION**

#### **Comprehensive Validation System:**
```javascript
// backend/src/shared/validators/ValidationService.js
const validator = require('validator');
const DOMPurify = require('isomorphic-dompurify');

class ValidationService {
  static validateUser(data) {
    const schema = {
      username: {
        required: true,
        type: 'string',
        minLength: 3,
        maxLength: 50,
        pattern: /^[a-zA-Z0-9_]+$/,
        sanitize: 'trim'
      },
      email: {
        required: true,
        type: 'email',
        maxLength: 255,
        sanitize: 'normalizeEmail'
      },
      password: {
        required: true,
        type: 'string',
        minLength: 12,
        maxLength: 128,
        custom: 'passwordStrength'
      },
      firstName: {
        required: true,
        type: 'string',
        minLength: 2,
        maxLength: 100,
        pattern: /^[a-zA-ZÀ-ÿ\s]+$/,
        sanitize: 'escape'
      },
      lastName: {
        required: true,
        type: 'string',
        minLength: 2,
        maxLength: 100,
        pattern: /^[a-zA-ZÀ-ÿ\s]+$/,
        sanitize: 'escape'
      }
    };

    return this.validate(data, schema);
  }

  static validate(data, schema) {
    const errors = [];
    const sanitized = {};

    for (const [field, rules] of Object.entries(schema)) {
      const value = data[field];

      // Required validation
      if (rules.required && (!value || value.toString().trim() === '')) {
        errors.push({
          field,
          message: `${field} is required`,
          code: 'REQUIRED'
        });
        continue;
      }

      if (!value && !rules.required) {
        sanitized[field] = value;
        continue;
      }

      // Type validation
      if (!this.validateType(value, rules.type)) {
        errors.push({
          field,
          message: `${field} must be a valid ${rules.type}`,
          code: 'INVALID_TYPE'
        });
        continue;
      }

      // Length validation
      if (rules.minLength && value.length < rules.minLength) {
        errors.push({
          field,
          message: `${field} must be at least ${rules.minLength} characters`,
          code: 'MIN_LENGTH'
        });
      }

      if (rules.maxLength && value.length > rules.maxLength) {
        errors.push({
          field,
          message: `${field} must not exceed ${rules.maxLength} characters`,
          code: 'MAX_LENGTH'
        });
      }

      // Pattern validation
      if (rules.pattern && !rules.pattern.test(value)) {
        errors.push({
          field,
          message: `${field} contains invalid characters`,
          code: 'INVALID_FORMAT'
        });
      }

      // Custom validation
      if (rules.custom) {
        const customResult = this.customValidators[rules.custom](value);
        if (!customResult.isValid) {
          errors.push({
            field,
            message: customResult.message,
            code: 'CUSTOM_VALIDATION'
          });
        }
      }

      // Sanitization
      sanitized[field] = this.sanitize(value, rules.sanitize);
    }

    return {
      isValid: errors.length === 0,
      errors,
      data: sanitized
    };
  }

  static validateType(value, type) {
    switch (type) {
      case 'email':
        return validator.isEmail(value);
      case 'url':
        return validator.isURL(value);
      case 'uuid':
        return validator.isUUID(value);
      case 'int':
        return validator.isInt(value.toString());
      case 'float':
        return validator.isFloat(value.toString());
      case 'boolean':
        return typeof value === 'boolean';
      case 'string':
        return typeof value === 'string';
      default:
        return true;
    }
  }

  static sanitize(value, method) {
    if (!method || typeof value !== 'string') return value;

    switch (method) {
      case 'trim':
        return value.trim();
      case 'escape':
        return DOMPurify.sanitize(value);
      case 'normalizeEmail':
        return validator.normalizeEmail(value);
      default:
        return value;
    }
  }

  static customValidators = {
    passwordStrength: (password) => {
      const result = zxcvbn(password);
      return {
        isValid: result.score >= 3,
        message: 'Password is too weak. Use a combination of letters, numbers, and symbols.'
      };
    }
  };
}
```

### **3. SECURE SESSION MANAGEMENT**

#### **Session Service:**
```javascript
// backend/src/infrastructure/security/SessionService.js
class SessionService {
  constructor(sessionRepository, tokenService) {
    this.sessionRepository = sessionRepository;
    this.tokenService = tokenService;
    this.maxConcurrentSessions = 3;
    this.sessionTimeout = 30 * 60 * 1000; // 30 minutes
  }

  async createSession(user, req) {
    // Check for existing sessions
    const existingSessions = await this.sessionRepository.findActiveByUserId(user.id);
    
    // Enforce concurrent session limit
    if (existingSessions.length >= this.maxConcurrentSessions) {
      // Remove oldest session
      const oldestSession = existingSessions.sort((a, b) => 
        new Date(a.lastActivity) - new Date(b.lastActivity)
      )[0];
      await this.invalidateSession(oldestSession.id);
    }

    // Generate token pair
    const tokens = this.tokenService.generateTokenPair(user);
    
    // Create session record
    const session = await this.sessionRepository.create({
      userId: user.id,
      sessionId: tokens.sessionId,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      ipAddress: this.getClientIP(req),
      userAgent: req.get('User-Agent'),
      deviceFingerprint: this.generateDeviceFingerprint(req),
      expiresAt: new Date(Date.now() + this.sessionTimeout),
      lastActivity: new Date()
    });

    return {
      session,
      tokens
    };
  }

  async validateSession(token) {
    try {
      const payload = this.tokenService.verifyAccessToken(token);
      const session = await this.sessionRepository.findBySessionId(payload.sessionId);
      
      if (!session || !session.isActive) {
        throw new AuthenticationError('Session not found or inactive');
      }

      if (new Date() > session.expiresAt) {
        await this.invalidateSession(session.id);
        throw new AuthenticationError('Session expired');
      }

      // Update last activity
      await this.sessionRepository.updateLastActivity(session.id);
      
      return {
        session,
        user: payload
      };
    } catch (error) {
      throw new AuthenticationError('Invalid session');
    }
  }

  async refreshSession(refreshToken) {
    const payload = this.tokenService.verifyRefreshToken(refreshToken);
    const session = await this.sessionRepository.findBySessionId(payload.sessionId);
    
    if (!session || !session.isActive) {
      throw new AuthenticationError('Invalid refresh token');
    }

    // Generate new access token
    const user = await this.userRepository.findById(payload.sub);
    const newTokens = this.tokenService.generateTokenPair(user);
    
    // Update session
    await this.sessionRepository.update(session.id, {
      accessToken: newTokens.accessToken,
      refreshToken: newTokens.refreshToken,
      lastActivity: new Date()
    });

    return newTokens;
  }

  async invalidateSession(sessionId) {
    await this.sessionRepository.deactivate(sessionId);
  }

  async invalidateAllUserSessions(userId) {
    await this.sessionRepository.deactivateAllByUserId(userId);
  }

  generateDeviceFingerprint(req) {
    const fingerprint = [
      req.get('User-Agent'),
      req.get('Accept-Language'),
      req.get('Accept-Encoding'),
      this.getClientIP(req)
    ].join('|');
    
    return crypto.createHash('sha256').update(fingerprint).digest('hex');
  }

  getClientIP(req) {
    return req.ip || 
           req.headers['x-forwarded-for'] || 
           req.headers['x-real-ip'] || 
           req.connection.remoteAddress;
  }
}
```

### **4. DATA ENCRYPTION**

#### **Encryption Service:**
```javascript
// backend/src/infrastructure/security/EncryptionService.js
const crypto = require('crypto');

class EncryptionService {
  constructor() {
    this.algorithm = 'aes-256-gcm';
    this.keyLength = 32;
    this.ivLength = 16;
    this.tagLength = 16;
    this.masterKey = Buffer.from(process.env.MASTER_ENCRYPTION_KEY, 'hex');
  }

  encrypt(plaintext, additionalData = '') {
    const iv = crypto.randomBytes(this.ivLength);
    const cipher = crypto.createCipher(this.algorithm, this.masterKey, { iv });
    
    if (additionalData) {
      cipher.setAAD(Buffer.from(additionalData));
    }

    let encrypted = cipher.update(plaintext, 'utf8');
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    
    const tag = cipher.getAuthTag();
    
    return {
      encrypted: encrypted.toString('hex'),
      iv: iv.toString('hex'),
      tag: tag.toString('hex')
    };
  }

  decrypt(encryptedData, additionalData = '') {
    const decipher = crypto.createDecipher(
      this.algorithm, 
      this.masterKey, 
      { iv: Buffer.from(encryptedData.iv, 'hex') }
    );
    
    decipher.setAuthTag(Buffer.from(encryptedData.tag, 'hex'));
    
    if (additionalData) {
      decipher.setAAD(Buffer.from(additionalData));
    }

    let decrypted = decipher.update(Buffer.from(encryptedData.encrypted, 'hex'));
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    
    return decrypted.toString('utf8');
  }

  hashSensitiveData(data) {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  generateSecureToken(length = 32) {
    return crypto.randomBytes(length).toString('hex');
  }
}
```

### **5. AUDIT LOGGING & MONITORING**

#### **Security Logger:**
```javascript
// backend/src/infrastructure/security/SecurityLogger.js
class SecurityLogger {
  constructor(auditRepository) {
    this.auditRepository = auditRepository;
  }

  async logAuthEvent(userId, action, details = {}, req = null) {
    const logEntry = {
      userId,
      action,
      category: 'AUTHENTICATION',
      ipAddress: req ? this.getClientIP(req) : null,
      userAgent: req ? req.get('User-Agent') : null,
      timestamp: new Date(),
      details: JSON.stringify(details),
      severity: this.getSeverity(action),
      success: !details.error
    };

    await this.auditRepository.create(logEntry);
    
    // Alert on suspicious activities
    if (this.isSuspiciousActivity(action, details)) {
      await this.sendSecurityAlert(logEntry);
    }
  }

  async logAccessAttempt(userId, resource, action, success, req) {
    const logEntry = {
      userId,
      action: `ACCESS_${action.toUpperCase()}`,
      category: 'AUTHORIZATION',
      resource,
      ipAddress: this.getClientIP(req),
      userAgent: req.get('User-Agent'),
      timestamp: new Date(),
      success,
      severity: success ? 'INFO' : 'WARNING'
    };

    await this.auditRepository.create(logEntry);
  }

  async logDataModification(userId, table, recordId, oldData, newData, req) {
    const changes = this.calculateChanges(oldData, newData);
    
    const logEntry = {
      userId,
      action: 'DATA_MODIFICATION',
      category: 'DATA_CHANGE',
      resource: `${table}:${recordId}`,
      ipAddress: this.getClientIP(req),
      userAgent: req.get('User-Agent'),
      timestamp: new Date(),
      details: JSON.stringify({ changes }),
      severity: 'INFO',
      success: true
    };

    await this.auditRepository.create(logEntry);
  }

  getSeverity(action) {
    const severityMap = {
      'LOGIN_SUCCESS': 'INFO',
      'LOGIN_FAILED': 'WARNING',
      'LOGOUT': 'INFO',
      'PASSWORD_CHANGED': 'INFO',
      'ACCOUNT_LOCKED': 'ERROR',
      'PERMISSION_DENIED': 'WARNING',
      'RATE_LIMIT_EXCEEDED': 'WARNING'
    };

    return severityMap[action] || 'INFO';
  }

  isSuspiciousActivity(action, details) {
    const suspiciousActions = [
      'MULTIPLE_FAILED_LOGINS',
      'RATE_LIMIT_EXCEEDED',
      'PERMISSION_DENIED',
      'ACCOUNT_LOCKED'
    ];

    return suspiciousActions.includes(action);
  }

  async sendSecurityAlert(logEntry) {
    // Integration with monitoring system (Slack, email, etc.)
    console.error('SECURITY ALERT:', logEntry);
  }

  calculateChanges(oldData, newData) {
    const changes = {};
    const allKeys = new Set([...Object.keys(oldData), ...Object.keys(newData)]);
    
    for (const key of allKeys) {
      if (oldData[key] !== newData[key]) {
        changes[key] = {
          from: oldData[key],
          to: newData[key]
        };
      }
    }
    
    return changes;
  }

  getClientIP(req) {
    return req.ip || 
           req.headers['x-forwarded-for'] || 
           req.headers['x-real-ip'] || 
           req.connection.remoteAddress;
  }
}
```

### **6. FRONTEND SECURITY**

#### **Secure Storage Service:**
```javascript
// frontend/src/utils/SecureStorage.js
class SecureStorage {
  constructor() {
    this.tokenKey = 'auth_token';
    this.refreshTokenKey = 'refresh_token';
    this.userKey = 'user_data';
  }

  // Use httpOnly cookies for tokens instead of localStorage
  setToken(token) {
    // This should be set by the server as httpOnly cookie
    document.cookie = `${this.tokenKey}=${token}; secure; samesite=strict; max-age=900`; // 15 minutes
  }

  setRefreshToken(refreshToken) {
    // This should be set by the server as httpOnly cookie
    document.cookie = `${this.refreshTokenKey}=${refreshToken}; secure; samesite=strict; max-age=604800`; // 7 days
  }

  getToken() {
    return this.getCookie(this.tokenKey);
  }

  getRefreshToken() {
    return this.getCookie(this.refreshTokenKey);
  }

  setUser(userData) {
    // Encrypt sensitive user data before storing
    const encrypted = this.encrypt(JSON.stringify(userData));
    sessionStorage.setItem(this.userKey, encrypted);
  }

  getUser() {
    const encrypted = sessionStorage.getItem(this.userKey);
    if (!encrypted) return null;
    
    try {
      const decrypted = this.decrypt(encrypted);
      return JSON.parse(decrypted);
    } catch (error) {
      console.error('Failed to decrypt user data');
      this.clear();
      return null;
    }
  }

  clear() {
    // Clear all tokens and user data
    document.cookie = `${this.tokenKey}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    document.cookie = `${this.refreshTokenKey}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    sessionStorage.removeItem(this.userKey);
    localStorage.clear();
  }

  getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
  }

  // Simple XOR encryption for client-side data (not for sensitive data)
  encrypt(text) {
    const key = 'client_encryption_key'; // In real app, use a proper key
    let result = '';
    for (let i = 0; i < text.length; i++) {
      result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return btoa(result);
  }

  decrypt(encryptedText) {
    const key = 'client_encryption_key';
    const text = atob(encryptedText);
    let result = '';
    for (let i = 0; i < text.length; i++) {
      result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return result;
  }
}
```

#### **XSS Protection:**
```javascript
// frontend/src/utils/XSSProtection.js
class XSSProtection {
  static sanitizeHTML(html) {
    const div = document.createElement('div');
    div.textContent = html;
    return div.innerHTML;
  }

  static sanitizeURL(url) {
    try {
      const parsed = new URL(url);
      // Only allow http and https protocols
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        return '#';
      }
      return url;
    } catch {
      return '#';
    }
  }

  static validateInput(input, type = 'text') {
    switch (type) {
      case 'email':
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input);
      case 'username':
        return /^[a-zA-Z0-9_]{3,50}$/.test(input);
      case 'numeric':
        return /^\d+$/.test(input);
      default:
        return typeof input === 'string' && input.length <= 1000;
    }
  }

  static escapeHTML(text) {
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(text));
    return div.innerHTML;
  }
}
```

### **7. ENVIRONMENT SECURITY**

#### **Environment Configuration:**
```bash
# .env.example
# Database
DATABASE_URL="mysql://username:password@localhost:3306/database"
DB_MAX_CONNECTIONS=10
DB_TIMEOUT=30000

# JWT Secrets (use crypto.randomBytes(64).toString('hex'))
JWT_ACCESS_SECRET=your_very_long_and_random_access_secret_here
JWT_REFRESH_SECRET=your_very_long_and_random_refresh_secret_here

# Encryption
MASTER_ENCRYPTION_KEY=your_256_bit_encryption_key_in_hex

# Session
SESSION_SECRET=your_session_secret_here
SESSION_TIMEOUT=1800000

# Email (for notifications)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your_email@example.com
SMTP_PASS=your_app_password

# Security
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX_REQUESTS=100
MAX_CONCURRENT_SESSIONS=3

# Logging
LOG_LEVEL=info
AUDIT_LOG_RETENTION_DAYS=365

# SSL/TLS
SSL_CERT_PATH=./certs/certificate.crt
SSL_KEY_PATH=./certs/private.key

# CORS
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Feature Flags
ENABLE_REGISTRATION=false
ENABLE_PASSWORD_RESET=true
REQUIRE_EMAIL_VERIFICATION=true
```

### **8. SECURITY HEADERS & MIDDLEWARE**

```javascript
// backend/src/infrastructure/web/middleware/SecurityMiddleware.js
const helmet = require('helmet');

class SecurityMiddleware {
  static configure(app) {
    // Security headers
    app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
          styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
          fontSrc: ["'self'", "https://fonts.gstatic.com"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'none'"]
        }
      },
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
      }
    }));

    // Custom security headers
    app.use((req, res, next) => {
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Frame-Options', 'DENY');
      res.setHeader('X-XSS-Protection', '1; mode=block');
      res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
      res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
      next();
    });

    // CORS configuration
    app.use(cors({
      origin: process.env.ALLOWED_ORIGINS?.split(',') || false,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      exposedHeaders: ['X-Total-Count']
    }));
  }
}
```

## 🚀 **IMPLEMENTATION ROADMAP**

### **Phase 1: Critical Security Fixes (Week 1)**
1. Remove hardcoded credentials
2. Implement strong password requirements
3. Add rate limiting
4. Enable HTTPS enforcement
5. Implement basic audit logging

### **Phase 2: Authentication & Authorization (Week 2)**
1. Implement JWT token service
2. Add session management
3. Create comprehensive validation
4. Implement role-based access control

### **Phase 3: Data Protection (Week 3)**
1. Add data encryption
2. Implement secure storage
3. Add XSS protection
4. Configure security headers

### **Phase 4: Monitoring & Compliance (Week 4)**
1. Complete audit logging system
2. Add security monitoring
3. Implement alerting
4. Security testing & penetration testing

## 📋 **SECURITY CHECKLIST**

- [ ] Remove all hardcoded credentials
- [ ] Implement strong password policies
- [ ] Add multi-factor authentication
- [ ] Enable rate limiting
- [ ] Implement session management
- [ ] Add input validation and sanitization
- [ ] Configure security headers
- [ ] Enable HTTPS everywhere
- [ ] Implement audit logging
- [ ] Add monitoring and alerting
- [ ] Conduct security testing
- [ ] Train team on security practices

This comprehensive security implementation will transform the e-clientes application from a vulnerable system to a secure, enterprise-grade application that protects user data and prevents common attack vectors.