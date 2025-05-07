// middlewares/errorHandler.js
const logger = require('../utils/logger');

module.exports = (err, req, res, next) => {
    // Registro del error
    logger.error(`${err.name}: ${err.message}`);
    logger.error(err.stack);
    
    // Determinar el código de estado HTTP
    const statusCode = err.statusCode || 500;
    
    // Responder con JSON
    res.status(statusCode).json({
        success: false,
        error: process.env.NODE_ENV === 'production' 
            ? 'Error en el servidor'
            : err.message
    });
};