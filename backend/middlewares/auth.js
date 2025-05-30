const jwt = require('jsonwebtoken');

// Middleware para verificar token JWT - VERSIÓN ACTUALIZADA
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
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // DEBUG temporal
console.log('🔍 Token decodificado:', {
  id: decoded.id,
  username: decoded.username,
  idCliente: decoded.idCliente
});
    
    // ✅ Añadir usuario al objeto request CON idCliente
    req.user = {
      id: decoded.id,
      username: decoded.username,
      role: decoded.role,
      originalId: decoded.originalId || decoded.id,
      idCliente: decoded.idCliente || decoded.id  // ✅ USAR id SI NO HAY idCliente
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

// FUNCIÓN PARA ADMIN - También actualizada
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Token de acceso requerido'
    });
  }

  // ✅ Quitar el fallback y usar solo process.env.JWT_SECRET
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      console.error('❌ Token inválido:', err.message);
      return res.status(403).json({
        success: false,
        message: 'Token inválido'
      });
    }

    // ✅ Incluir idCliente también aquí
    req.user = {
      id: user.id,
      username: user.username,
      role: user.role,
      originalId: user.originalId || user.id,
      idCliente: user.idCliente || user.id  // ✅ USAR id SI NO HAY idCliente
    };
    next();
  });
};

// Middleware para verificar roles (sin cambios)
const checkRole = (roles = []) => {
  return (req, res, next) => {

    console.log('🔍 CheckRole - Usuario:', req.user?.username, 'Rol:', req.user?.role, 'Roles permitidos:', roles); // DEBUG


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

// Middleware para verificar permisos específicos (sin cambios)
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
  authenticateToken,
  checkRole,
  checkPermission
};