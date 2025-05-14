const jwt = require('jsonwebtoken');
const prisma = require('../utils/prisma');

// Middleware para verificar token JWT
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
    
    // Comprobar si el usuario existe en la base de datos
    const user = await prisma.BP_01_USUARIO.findUnique({
      where: { 
        nId01Usuario: decoded.id 
      },
      include: {
        perfilesUsuario: {
          include: {
            perfil: {
              include: {
                perfilesPermiso: {
                  include: {
                    permiso: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Token inválido - Usuario no encontrado' 
      });
    }

    if (!user.bActivo) {
      return res.status(403).json({ 
        success: false, 
        message: 'Usuario inactivo, contacte al administrador' 
      });
    }
    
    // Añadir usuario al objeto request
    req.user = {
      id: user.nId01Usuario,
      username: user.sUsuario,
      role: decoded.role,
      permisos: user.perfilesUsuario[0]?.perfil?.perfilesPermiso?.map(p => ({
        nombre: p.permiso.sNombre,
        leer: p.nLeer,
        crear: p.nCrear,
        editar: p.nEditar,
        borrar: p.nBorrar
      })) || []
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

    const permission = req.user.permisos.find(p => p.nombre === permissionName);
    
    if (!permission || !permission[action]) {
      return res.status(403).json({
        success: false,
        message: `No tiene permiso para ${action} en ${permissionName}`
      });
    }

    next();
  };
};

module.exports = {
  verifyToken,
  checkRole,
  checkPermission
};