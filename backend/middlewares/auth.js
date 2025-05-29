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
      role: decoded.role,
      originalId: decoded.originalId || decoded.id // Para compatibilidad con admin
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

// NUEVA FUNCIÓN - Para compatibilidad con rutas de admin
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Token de acceso requerido'
    });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'clave_secreta_para_jwt', (err, user) => {
    if (err) {
      console.error('❌ Token inválido:', err.message);
      return res.status(403).json({
        success: false,
        message: 'Token inválido'
      });
    }

    req.user = {
      id: user.id,
      username: user.username,
      role: user.role,
      originalId: user.originalId || user.id
    };
    next();
  });
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
  authenticateToken, // ← NUEVA EXPORTACIÓN
  checkRole,
  checkPermission
};