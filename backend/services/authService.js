// services/authService.js
// Servicio de autenticación simplificado (sin dependencia de modelo User)

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../utils/prisma');

exports.authenticate = async (username, password) => {
  try {
    // Autenticación simple para desarrollo
    if (process.env.NODE_ENV === 'development' && username === 'usuario' && password === 'password123') {
      return {
        success: true,
        token: jwt.sign(
          { id: 0, username: 'usuario', role: 'ADMIN' },
          process.env.JWT_SECRET || 'clave_secreta_para_jwt',
          { expiresIn: '8h' }
        ),
        user: {
          id: 0,
          username: 'usuario',
          name: 'Usuario de Prueba',
          role: 'ADMIN'
        }
      };
    }

    // Buscar usuario en la base de datos
    const user = await prisma.BP_01_USUARIO.findUnique({
      where: { sUsuario: username },
      include: {
        perfilesUsuario: {
          include: {
            perfil: true
          }
        }
      }
    });

    // Verificar si existe el usuario y si la contraseña es correcta
    if (!user || !await bcrypt.compare(password, user.sPassword)) {
      return {
        success: false,
        message: 'Credenciales incorrectas'
      };
    }

    // Verificar si el usuario está activo
    if (!user.bActivo) {
      return {
        success: false,
        message: 'Usuario inactivo. Contacte al administrador.'
      };
    }

    // Obtener el perfil del usuario
    const perfil = user.perfilesUsuario[0]?.perfil?.sNombre || 'usuario';

    // Generar token JWT
    const token = jwt.sign(
      { 
        id: user.nId01Usuario, 
        username: user.sUsuario,
        role: perfil
      },
      process.env.JWT_SECRET || 'clave_secreta_para_jwt',
      { expiresIn: '8h' }
    );

    // Retornar información del usuario autenticado
    return {
      success: true,
      token,
      user: {
        id: user.nId01Usuario,
        username: user.sUsuario,
        name: `${user.sNombre} ${user.sApellidoPaterno} ${user.sApellidoMaterno}`,
        role: perfil,
        image: user.sUsuarioImg
      }
    };
  } catch (error) {
    console.error('Error en authenticate:', error);
    return {
      success: false,
      message: 'Error interno del servidor'
    };
  }
};

// Función para hashear contraseñas
exports.hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

// Función para verificar contraseñas
exports.verifyPassword = async (inputPassword, hashedPassword) => {
  return bcrypt.compare(inputPassword, hashedPassword);
};

// Función para actualizar contraseña de usuario
exports.updatePassword = async (userId, newPassword) => {
  try {
    const hashedPassword = await this.hashPassword(newPassword);
    
    await prisma.BP_01_USUARIO.update({
      where: { nId01Usuario: userId },
      data: { 
        sPassword: hashedPassword,
        dFechaActualizacion: new Date()
      }
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error al actualizar contraseña:', error);
    return { 
      success: false, 
      message: 'Error al actualizar contraseña' 
    };
  }
};


// Función para obtener información del dispositivo
exports.getDeviceInfo = (userAgent) => {
  if (!userAgent) return 'Unknown';
  if (userAgent.includes('Mobile')) return 'Mobile';
  if (userAgent.includes('Tablet')) return 'Tablet';
  return 'Desktop';
};

// Función para crear log de autenticación
exports.createAuthLog = async (data) => {
  try {
    return await prisma.bP_07_LOG_AUTENTICACION.create({
      data: data
    });
  } catch (error) {
    console.error('Error al crear log de autenticación:', error);
    // No lanzar error para no interrumpir el flujo
  }
};

// Función para crear sesión activa
exports.createActiveSession = async (userId, token, req) => {
  try {
    const fechaExpiracion = new Date();
    fechaExpiracion.setHours(fechaExpiracion.getHours() + 24);
    
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'Unknown';
    const userAgent = req.headers['user-agent'] || '';
    const dispositivo = this.getDeviceInfo(userAgent);
    
    return await prisma.bP_08_SESION_ACTIVA.create({
      data: {
        nId01Usuario: userId,
        sTokenSesion: token,
        dFechaExpiracion: fechaExpiracion,
        sIpUsuario: ipAddress,
        sUserAgent: userAgent,
        sDispositivo: dispositivo,
        bActiva: true
      }
    });
  } catch (error) {
    console.error('Error al crear sesión activa:', error);
  }
};

// Función para desactivar sesión
exports.deactivateSession = async (token) => {
  try {
    return await prisma.bP_08_SESION_ACTIVA.updateMany({
      where: {
        sTokenSesion: token,
        bActiva: true
      },
      data: {
        bActiva: false
      }
    });
  } catch (error) {
    console.error('Error al desactivar sesión:', error);
  }
};

// Función para verificar caducidad de contraseña
exports.checkPasswordExpiry = async (userId) => {
  try {
    const user = await prisma.bP_01_USUARIO.findUnique({
      where: { nId01Usuario: userId }
    });
    
    if (!user) return null;
    
    const diasCaducidad = 90; // 90 días según tu requerimiento
    const fechaUltimoCambio = new Date(user.dFechaUltimoCambioPass);
    const fechaActual = new Date();
    const diasTranscurridos = Math.floor((fechaActual.getTime() - fechaUltimoCambio.getTime()) / (1000 * 60 * 60 * 24));
    
    return {
      caducada: diasTranscurridos > diasCaducidad,
      diasTranscurridos,
      diasRestantes: diasCaducidad - diasTranscurridos
    };
  } catch (error) {
    console.error('Error al verificar caducidad de contraseña:', error);
    return null;
  }
};

// Función para obtener sesiones activas de un usuario
exports.getActiveSessions = async (userId) => {
  try {
    return await prisma.bP_08_SESION_ACTIVA.findMany({
      where: {
        nId01Usuario: userId,
        bActiva: true,
        dFechaExpiracion: {
          gt: new Date()
        }
      },
      orderBy: {
        dFechaUltimaActividad: 'desc'
      }
    });
  } catch (error) {
    console.error('Error al obtener sesiones activas:', error);
    return [];
  }
};

// Función para obtener logs de autenticación
exports.getAuthLogs = async (userId, limit = 10) => {
  try {
    return await prisma.bP_07_LOG_AUTENTICACION.findMany({
      where: {
        nId01Usuario: userId
      },
      orderBy: {
        dFechaHora: 'desc'
      },
      take: limit
    });
  } catch (error) {
    console.error('Error al obtener logs de autenticación:', error);
    return [];
  }
};

// Función para limpiar sesiones expiradas
exports.cleanExpiredSessions = async () => {
  try {
    const result = await prisma.bP_08_SESION_ACTIVA.updateMany({
      where: {
        bActiva: true,
        dFechaExpiracion: {
          lt: new Date()
        }
      },
      data: {
        bActiva: false
      }
    });
    
    console.log(`Se desactivaron ${result.count} sesiones expiradas`);
    return result.count;
  } catch (error) {
    console.error('Error al limpiar sesiones expiradas:', error);
    return 0;
  }
};