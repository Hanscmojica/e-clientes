// config/env-validation.js
// Environment variable validation for security

const requiredEnvVars = {
    'JWT_SECRET': {
        required: true,
        minLength: 32,
        description: 'JWT signing secret - must be at least 32 characters'
    },
    'DATABASE_URL': {
        required: true,
        pattern: /^mysql:\/\/.+/,
        description: 'Database connection string'
    },
    'FTP_HOST': {
        required: true,
        description: 'FTP server hostname'
    },
    'FTP_USER': {
        required: true,
        description: 'FTP username'
    },
    'FTP_PASSWORD': {
        required: true,
        minLength: 8,
        description: 'FTP password'
    },
    'NODE_ENV': {
        required: true,
        allowedValues: ['development', 'production', 'test'],
        description: 'Node environment'
    }
};

const optionalEnvVars = {
    'PORT': { default: '5000' },
    'SSL_PORT': { default: '443' },
    'JWT_EXPIRE': { default: '8h' },
    'FTP_PORT': { default: '21' },
    'FTP_SECURE': { default: 'false' }
};

function validateEnvironment() {
    const errors = [];
    const warnings = [];

    // Check required variables
    for (const [varName, config] of Object.entries(requiredEnvVars)) {
        const value = process.env[varName];
        
        if (!value) {
            errors.push(`❌ Missing required environment variable: ${varName} - ${config.description}`);
            continue;
        }

        // Check minimum length
        if (config.minLength && value.length < config.minLength) {
            errors.push(`❌ ${varName} must be at least ${config.minLength} characters long`);
        }

        // Check pattern
        if (config.pattern && !config.pattern.test(value)) {
            errors.push(`❌ ${varName} format is invalid - ${config.description}`);
        }

        // Check allowed values
        if (config.allowedValues && !config.allowedValues.includes(value)) {
            errors.push(`❌ ${varName} must be one of: ${config.allowedValues.join(', ')}`);
        }
    }

    // Set defaults for optional variables
    for (const [varName, config] of Object.entries(optionalEnvVars)) {
        if (!process.env[varName] && config.default) {
            process.env[varName] = config.default;
            warnings.push(`⚠️ Using default value for ${varName}: ${config.default}`);
        }
    }

    // Security checks
    if (process.env.NODE_ENV === 'production') {
        // JWT Secret strength check
        if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 64) {
            warnings.push('⚠️ JWT_SECRET should be at least 64 characters in production');
        }

        // Database URL security check
        if (process.env.DATABASE_URL && process.env.DATABASE_URL.includes('localhost')) {
            warnings.push('⚠️ Database URL contains localhost in production environment');
        }

        // FTP security check
        if (process.env.FTP_SECURE === 'false') {
            warnings.push('⚠️ FTP is not using secure connection in production');
        }
    }

    // Report results
    if (errors.length > 0) {
        console.error('\n🚨 ENVIRONMENT VALIDATION FAILED:');
        errors.forEach(error => console.error(error));
        console.error('\n💡 Please check your .env file and ensure all required variables are set.\n');
        process.exit(1);
    }

    if (warnings.length > 0) {
        console.warn('\n⚠️ ENVIRONMENT WARNINGS:');
        warnings.forEach(warning => console.warn(warning));
        console.warn('');
    }

    console.log('✅ Environment validation passed');
    return true;
}

module.exports = {
    validateEnvironment,
    requiredEnvVars,
    optionalEnvVars
};