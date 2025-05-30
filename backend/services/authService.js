// services/authService.js - VERSIÓN LIMPIA 100% DINÁMICO

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../utils/prisma');

exports.authenticate = async (username, password) => {
  try {
    console.log(`🔐 Intentando autenticar usuario: ${username}`);

    // ✅ BUSCAR USUARIO EN BASE DE DATOS (única fuente de verdad)
    const user = await prisma.BP_01_USUARIO.findUnique({
      where: { sUsuario: username.toUpperCase() },
      include: {
        perfilesUsuario: {
          include: {
            perfil: true
          }
        }
      }
    });

    // Verificar si existe el usuario
    if (!user) {
      console.log(`❌ Usuario no encontrado: ${username}`);
      return {
        success: false,
        message: 'Credenciales incorrectas'
      };
    }

    // Verificar contraseña
    const passwordValid = await bcrypt.compare(password, user.sPassword);
    if (!passwordValid) {
      console.log(`❌ Contraseña incorrecta para: ${username}`);
      return {
        success: false,
        message: 'Credenciales incorrectas'
      };
    }

    // Verificar si el usuario está activo
    if (!user.bActivo) {
      console.log(`❌ Usuario inactivo: ${username}`);
      return {
        success: false,
        message: 'Usuario inactivo. Contacte al administrador.'
      };
    }

    // Verificar que tenga ID Cliente asignado
    if (!user.nIdCliente) {
      console.log(`❌ Usuario sin ID Cliente: ${username}`);
      return {
        success: false,
        message: 'Usuario sin ID Cliente asignado. Contacte al administrador.'
      };
    }

    // Obtener perfil desde BD
    const perfil = user.perfilesUsuario[0]?.perfil?.sNombre || 'USER';

    // ✅ TOKEN COMPLETAMENTE DINÁMICO DESDE BD
    const tokenData = {
      id: user.nId01Usuario,
      originalId: user.nId01Usuario,
      username: user.sUsuario,
      role: perfil,
      idCliente: user.nIdCliente
    };

    // Usar JWT_SECRET desde variables de entorno
    const token = jwt.sign(
      tokenData,
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '24h' }
    );

    console.log(`✅ Login exitoso:`, {
      usuario: user.sUsuario,
      idOriginal: user.nId01Usuario,
      idCliente: user.nIdCliente,
      role: perfil
    });

    // ✅ RESPUESTA COMPLETAMENTE DESDE BD
    return {
      success: true,
      token,
      user: {
        id: user.nId01Usuario,
        originalId: user.nId01Usuario,
        username: user.sUsuario,
        name: `${user.sNombre} ${user.sApellidoPaterno} ${user.sApellidoMaterno}`.trim(),
        email: user.sEmail,
        role: perfil,
        image: user.sUsuarioImg,
        idCliente: user.nIdCliente
      }
    };

  } catch (error) {
    console.error('❌ Error en authenticate:', error);
    return {
      success: false,
      message: 'Error interno del servidor'
    };
  }
};

// ✅ RESTO DE FUNCIONES SIN CAMBIOS - YA ESTÁN DINÁMICAS
exports.hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

exports.verifyPassword = async (inputPassword, hashedPassword) => {
  return bcrypt.compare(inputPassword, hashedPassword);
};

exports.updatePassword = async (userId, newPassword) => {
  try {
    const hashedPassword = await this.hashPassword(newPassword);
    
    await prisma.BP_01_USUARIO.update({
      where: { nId01Usuario: userId },
      data: { 
        sPassword: hashedPassword,
        dFechaUltimoCambioPass: new Date()
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

exports.getDeviceInfo = (userAgent) => {
  if (!userAgent) return 'Unknown';
  if (userAgent.includes('Mobile')) return 'Mobile';
  if (userAgent.includes('Tablet')) return 'Tablet';
  return 'Desktop';
};

exports.createAuthLog = async (data) => {
  try {
    return await prisma.BP_07_LOG_AUTENTICACION.create({
      data: data
    });
  } catch (error) {
    console.error('Error al crear log de autenticación:', error);
  }
};

exports.createActiveSession = async (userId, token, req) => {
  try {
    const fechaExpiracion = new Date();
    fechaExpiracion.setHours(fechaExpiracion.getHours() + 24);
    
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'Unknown';
    const userAgent = req.headers['user-agent'] || '';
    const dispositivo = this.getDeviceInfo(userAgent);
    
    return await prisma.BP_08_SESION_ACTIVA.create({
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

exports.deactivateSession = async (token) => {
  try {
    return await prisma.BP_08_SESION_ACTIVA.updateMany({
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

exports.checkPasswordExpiry = async (userId) => {
  try {
    const user = await prisma.BP_01_USUARIO.findUnique({
      where: { nId01Usuario: userId }
    });
    
    if (!user) return null;
    
    const diasCaducidad = 90;
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

exports.getActiveSessions = async (userId) => {
  try {
    return await prisma.BP_08_SESION_ACTIVA.findMany({
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

exports.getAuthLogs = async (userId, limit = 10) => {
  try {
    return await prisma.BP_07_LOG_AUTENTICACION.findMany({
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

exports.cleanExpiredSessions = async () => {
  try {
    const result = await prisma.BP_08_SESION_ACTIVA.updateMany({
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