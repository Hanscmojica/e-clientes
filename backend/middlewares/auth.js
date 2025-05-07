const jwt = require('jsonwebtoken');
const config = require('../config/database');

// Middleware para verificar token JWT
module.exports = (req, res, next) => {
  // Obtener token del encabezado
  const token = req.header('x-auth-token');
  
  // Verificar si no hay token
  if (!token) {
    return res.status(401).json({ success: false, message: 'Acceso denegado, token no proporcionado' });
  }
  
  try {
    // Verificar token
    const decoded = jwt.verify(token, config.jwtSecret);
    
    // Añadir usuario al objeto request
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: 'Token inválido' });
  }
};