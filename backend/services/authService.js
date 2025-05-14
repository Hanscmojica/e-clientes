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