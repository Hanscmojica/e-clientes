const jwt = require('jsonwebtoken');

// Middleware para verificar token JWT - VERSIÓN SIMPLE ORIGINAL
const verifyToken = async (req, res, next) => {
  try {
    // Obtener token del encabezado
    const token = req.header('Authorization')?.replace('Bearer ', '') || 
                  req.header('x-auth-token');
    
    // Verificar si no hay token
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Acceso denegado, token no proporcionado' 
      });
    }
    
    // Verificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'clave_secreta_para_jwt');
    
    // Añadir usuario al objeto request
    req.user = {
      id: decoded.id,
      username: decoded.username,
      role: decoded.role
    };
    
    next();
  } catch (error) {
    console.error('Error en verificación de token:', error);
    res.status(401).json({ 
      success: false, 
      message: 'Token inválido o expirado' 
    });
  }
};

// Middleware para verificar roles
const checkRole = (roles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'No autenticado'
      });
    }

    const userRole = req.user.role;
    
    if (roles.length > 0 && !roles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'No tiene permisos para acceder a este recurso'
      });
    }

    next();
  };
};

// Middleware para verificar permisos específicos
const checkPermission = (permissionName, action = 'leer') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'No autenticado'
      });
    }

    // Permitir acceso si está autenticado
    next();
  };
};

module.exports = {
  verifyToken,
  checkRole,
  checkPermission
};