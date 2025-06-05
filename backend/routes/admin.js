// routes/admin.js
const express = require('express');
const bcrypt = require('bcryptjs');
const prisma = require('../utils/prisma');
const { verifyToken: authenticateToken } = require('../middlewares/auth');
const router = express.Router();
const authService = require('../services/authService');

// Middleware para verificar que sea administrador
const requireAdmin = (req, res, next) => {
  console.log('🔍 Verificando permisos de admin para usuario:', req.user);
  
  if (req.user.role !== 'ADMIN' && req.user.role !== 'ADMINISTRADOR') {
    return res.status(403).json({
      success: false,
      message: 'Acceso denegado. Se requieren permisos de administrador.'
    });
  }
  next();
};

// ===============================
// DASHBOARD ENDPOINTS
// ===============================

// GET /api/admin/stats - Estadísticas del dashboard
router.get('/stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    console.log('📊 Obteniendo estadísticas del dashboard...');

    // Contar usuarios
    const totalUsuarios = await prisma.BP_01_USUARIO.count();
    const usuariosActivos = await prisma.BP_01_USUARIO.count({
      where: { bActivo: true }
    });

    // Logins de hoy (simulado - necesitarías una tabla de logs)
    const loginsHoy = Math.floor(Math.random() * 20) + 5;

    // Referencias del mes (simulado)
    const referenciasMes = Math.floor(Math.random() * 100) + 20;

    const stats = {
      totalUsuarios,
      usuariosActivos,
      loginsHoy,
      referenciasMes
    };

    console.log('✅ Estadísticas obtenidas:', stats);

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('❌ Error obteniendo estadísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// GET /api/admin/recent-activity - Actividad reciente
router.get('/recent-activity', authenticateToken, requireAdmin, async (req, res) => {
  try {
    console.log('📋 Obteniendo actividad reciente...');
    
    // Por ahora devolver actividad simulada
    const activity = [
      {
        id: 1,
        type: 'LOGIN',
        description: `${req.user.username} inició sesión`,
        timestamp: new Date().toISOString(),
        userId: req.user.id
      },
      {
        id: 2,
        type: 'USER_ACCESSED',
        description: 'Usuario consultó referencias',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        userId: null
      }
    ];

    res.json({
      success: true,
      data: activity
    });

  } catch (error) {
    console.error('❌ Error obteniendo actividad:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// ===============================
// GESTIÓN DE USUARIOS
// ===============================

// GET /api/admin/usuarios - Listar todos los usuarios
router.get('/usuarios', authenticateToken, requireAdmin, async (req, res) => {
  try {
    console.log('👥 Obteniendo lista de usuarios...');

    const usuarios = await prisma.BP_01_USUARIO.findMany({
      include: {
        perfilesUsuario: {
          include: {
            perfil: true
          }
        }
      },
      orderBy: {
        nId01Usuario: 'asc'
      }
    });

    // ✅ FORMATEAR DATOS CORREGIDO PARA EL FRONTEND
    const usuariosFormateados = usuarios.map(usuario => {
      const perfil = usuario.perfilesUsuario[0]?.perfil?.sNombre || 'USER';
      
      return {
        id: usuario.nId01Usuario,           // ✅ USAR ID ÚNICO DEL USUARIO
        idCliente: usuario.nIdCliente,      // ✅ AGREGAR idCliente POR SEPARADO  
        username: usuario.sUsuario,
        name: `${usuario.sNombre} ${usuario.sApellidoPaterno} ${usuario.sApellidoMaterno}`.trim(),
        email: usuario.sEmail,
        role: perfil,
        active: usuario.bActivo,
        createdAt: usuario.dFechaCreacion?.toISOString(),
        image: usuario.sUsuarioImg
      };
    });
    
    console.log(`✅ ${usuariosFormateados.length} usuarios obtenidos`);

    res.json({
      success: true,
      data: usuariosFormateados
    });

  } catch (error) {
    console.error('❌ Error obteniendo usuarios:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// POST /api/admin/usuarios - Crear nuevo usuario
router.post('/usuarios', authenticateToken, requireAdmin, async (req, res) => {
  try {
    console.log('➕ Creando nuevo usuario...', req.body);

    const {
        username,
        nombre,
        apellidoPaterno,
        apellidoMaterno,
        email,
        password,
        activo = true,
        perfil,
        imagen,
        idCliente  
      } = req.body;

    // Validaciones
    if (!nombre || !apellidoPaterno || !username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Campos requeridos: nombre, apellidoPaterno, username, email, password'
      });
    }

    if (!idCliente) {
      return res.status(400).json({
        success: false,
        message: 'El ID Cliente es requerido'
      });
    }

    // Verificar si el usuario ya existe
    const usuarioExistente = await prisma.BP_01_USUARIO.findUnique({
      where: { sUsuario: username.toUpperCase() }
    });

    if (usuarioExistente) {
      return res.status(400).json({
        success: false,
        message: 'El nombre de usuario ya existe'
      });
    }

    // Verificar si el email ya existe
    const emailExistente = await prisma.BP_01_USUARIO.findFirst({
      where: { sEmail: email }
    });

    if (emailExistente) {
      return res.status(400).json({
        success: false,
        message: 'El email ya está registrado'
      });
    }

    // Encriptar contraseña
    const hashedPassword = await bcrypt.hash(password, 12);

    // Crear usuario
    const nuevoUsuario = await prisma.BP_01_USUARIO.create({
      data: {
        sUsuario: username.toUpperCase(),
        sNombre: nombre,
        sApellidoPaterno: apellidoPaterno,
        sApellidoMaterno: apellidoMaterno || '',
        sEmail: email,
        sPassword: hashedPassword,
        bActivo: activo,
        sUsuarioImg: imagen,
        nIdCliente: idCliente,
        dFechaCreacion: new Date(),
      }
    });

    // Asignar perfil si se especifica
    if (perfil) {
      const perfilObj = await prisma.BP_02_PERFIL.findFirst({
      where: { sNombre: perfil }
    });

      if (perfilObj) {
        await prisma.BP_04_PERFIL_USUARIO.create({
        data: {
            nId01Usuario: nuevoUsuario.nId01Usuario, // ✅ CAMBIO: nId01Usuario
            nId02Perfil: perfilObj.nId02Perfil       // ✅ CAMBIO: nId02Perfil
          }
        });
        }
      }

    console.log('✅ Usuario creado exitosamente:', nuevoUsuario.sUsuario);

    // Devolver datos del usuario creado  
    res.status(201).json({
      success: true,
      message: 'Usuario creado exitosamente',
      data: {
        id: nuevoUsuario.nId01Usuario,      // ✅ CORREGIDO: ID ÚNICO
        idCliente: nuevoUsuario.nIdCliente, // ✅ CORREGIDO: ID CLIENTE SEPARADO
        username: nuevoUsuario.sUsuario,
        name: `${nuevoUsuario.sNombre} ${nuevoUsuario.sApellidoPaterno} ${nuevoUsuario.sApellidoMaterno}`.trim(),
        email: nuevoUsuario.sEmail,
        role: perfil || 'USER',
        active: nuevoUsuario.bActivo,
        createdAt: nuevoUsuario.dFechaCreacion.toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Error creando usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// ✅ PUT CORREGIDO - Actualizar usuario
router.put('/usuarios/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    console.log('📝 Actualizando usuario ID:', userId);

    const {
      nombre,
      apellidoPaterno,
      apellidoMaterno,
      email,
      activo,
      perfil,        // ← Nombre del perfil: "CLIENTE", "ADMINISTRADOR", etc.
      imagen,
      idCliente
    } = req.body;

    console.log('📋 Datos recibidos:', { nombre, email, perfil, idCliente }); // DEBUG

    // ✅ CORREGIDO: Buscar usuario SOLO por ID único (no por idCliente)
    const usuario = await prisma.BP_01_USUARIO.findUnique({
      where: { nId01Usuario: userId }
    });
     
    if (!usuario) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // 1. Actualizar datos básicos del usuario
    const usuarioActualizado = await prisma.BP_01_USUARIO.update({
      where: { nId01Usuario: usuario.nId01Usuario },
      data: {
        sNombre: nombre || usuario.sNombre,
        sApellidoPaterno: apellidoPaterno || usuario.sApellidoPaterno,
        sApellidoMaterno: apellidoMaterno || usuario.sApellidoMaterno,
        sEmail: email || usuario.sEmail,
        bActivo: activo !== undefined ? activo : usuario.bActivo,
        sUsuarioImg: imagen !== undefined ? imagen : usuario.sUsuarioImg,
        nIdCliente: idCliente || usuario.nIdCliente,
        dFechaActualizacion: new Date()
      }
    });

    // 2. ✅ NUEVO: Actualizar el perfil/rol si se envió
    if (perfil) {
      console.log('🔄 Actualizando perfil a:', perfil);
      
      // Buscar el ID del perfil por nombre
      const perfilObj = await prisma.BP_02_PERFIL.findFirst({
        where: { sNombre: perfil }
      });

      if (perfilObj) {
        // Actualizar la relación usuario-perfil
        await prisma.BP_04_PERFIL_USUARIO.updateMany({
          where: { nId01Usuario: usuario.nId01Usuario },
          data: { 
            nId02Perfil: perfilObj.nId02Perfil,
            dFechaActualizacion: new Date()
          }
        });
        console.log('✅ Perfil actualizado correctamente a:', perfil);
      } else {
        console.log('⚠️ Perfil no encontrado:', perfil);
      }
    }

    console.log('✅ Usuario actualizado:', usuarioActualizado.sUsuario);
    
    res.json({
      success: true,
      message: 'Usuario actualizado exitosamente',
      data: {
        id: usuarioActualizado.nId01Usuario,     // ✅ CORREGIDO: ID ÚNICO
        idCliente: usuarioActualizado.nIdCliente, // ✅ CORREGIDO: ID CLIENTE SEPARADO
        username: usuarioActualizado.sUsuario,
        name: `${usuarioActualizado.sNombre} ${usuarioActualizado.sApellidoPaterno} ${usuarioActualizado.sApellidoMaterno}`.trim(),
        email: usuarioActualizado.sEmail,
        role: perfil || 'USER', // ✅ Devolver el nuevo rol
        active: usuarioActualizado.bActivo
      }
    });

  } catch (error) {
    console.error('❌ Error actualizando usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor: ' + error.message
    });
  }
});

// PATCH /api/admin/usuarios/:id/toggle-status - Activar/desactivar usuario
router.patch('/usuarios/:id/toggle-status', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const { active } = req.body;

    console.log(`🔄 ${active ? 'Activando' : 'Desactivando'} usuario ID:`, userId);

    // ✅ CORREGIDO: Buscar usuario SOLO por ID único (no por idCliente)
    const usuario = await prisma.BP_01_USUARIO.findUnique({
      where: { nId01Usuario: userId }
    });

    if (!usuario) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Actualizar estado
    await prisma.BP_01_USUARIO.update({
      where: { nId01Usuario: usuario.nId01Usuario },
      data: { bActivo: active }
    });

    console.log(`✅ Usuario ${active ? 'activado' : 'desactivado'}:`, usuario.sUsuario);

    res.json({
      success: true,
      message: `Usuario ${active ? 'activado' : 'desactivado'} exitosamente`
    });

  } catch (error) {
    console.error('❌ Error cambiando estado:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// DELETE /api/admin/usuarios/:id - Eliminar usuario
router.delete('/usuarios/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    console.log('🗑️ Eliminando usuario ID:', userId);

    // ✅ CORREGIDO: Buscar usuario SOLO por ID único (no por idCliente)
    const usuario = await prisma.BP_01_USUARIO.findUnique({
      where: { nId01Usuario: userId }
    });

    if (!usuario) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // No permitir eliminar al usuario actual
    if (usuario.nId01Usuario === req.user.originalId || usuario.sUsuario === req.user.username) {
      return res.status(400).json({
        success: false,
        message: 'No puedes eliminar tu propia cuenta'
      });
    }

    // Eliminar relaciones primero
    await prisma.BP_04_PERFIL_USUARIO.deleteMany({
      where: { nId01Usuario: usuario.nId01Usuario }
    });

    // Eliminar usuario
    await prisma.BP_01_USUARIO.delete({
      where: { nId01Usuario: usuario.nId01Usuario }
    });

    console.log('✅ Usuario eliminado:', usuario.sUsuario);

    res.json({
      success: true,
      message: 'Usuario eliminado exitosamente'
    });

  } catch (error) {
    console.error('❌ Error eliminando usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// ===============================
// GESTIÓN DE PERFILES
// ===============================

// GET /api/admin/perfiles - Listar perfiles
router.get('/perfiles', authenticateToken, requireAdmin, async (req, res) => {
  try {
    console.log('🏷️ Obteniendo perfiles...');

    const perfiles = await prisma.BP_02_PERFIL.findMany({
      include: {
        _count: {
          select: { 
            perfilesUsuario: true 
          }
        }
      }
    });

    const perfilesFormateados = perfiles.map(perfil => ({
      id: perfil.nId02Perfil,
      nombre: perfil.sNombre,
      descripcion: perfil.sDescripcion || `Perfil ${perfil.sNombre}`,
      usuarios: perfil._count.perfilesUsuario,
      activo: true
    }));

    console.log(`✅ ${perfilesFormateados.length} perfiles obtenidos`);

    res.json({
      success: true,
      data: perfilesFormateados
    });

  } catch (error) {
    console.error('❌ Error obteniendo perfiles:', error);
    res.status(500).json({  
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// GET /api/admin/logs - Obtener logs del sistema con filtros y paginación
// GET /api/admin/logs - CORREGIDO para usar BP_07_LOG_AUTENTICACION
router.get('/logs', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 100, startDate, endDate, type } = req.query;
    
    console.log('📋 Obteniendo logs del sistema...', { page, limit, startDate, endDate, type });
    
    // ✅ CORREGIDO: Construir filtros para la tabla correcta BP_07_LOG_AUTENTICACION
    const where = {};
    
    // Filtro por fechas
    if (startDate && endDate) {
      where.dFechaHora = {
        gte: new Date(startDate + 'T00:00:00.000Z'),
        lte: new Date(endDate + 'T23:59:59.999Z')
      };
    } else if (startDate) {
      where.dFechaHora = {
        gte: new Date(startDate + 'T00:00:00.000Z')
      };
    } else if (endDate) {
      where.dFechaHora = {
        lte: new Date(endDate + 'T23:59:59.999Z')
      };
    }
    
    // Filtro por tipo de evento
    if (type) {
      where.sTipoAccion = type;
    }
    
    // Calcular offset para paginación
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    // ✅ CORREGIDO: Obtener logs desde BP_07_LOG_AUTENTICACION con relación al usuario
    const [logs, totalLogs] = await Promise.all([
      prisma.BP_07_LOG_AUTENTICACION.findMany({
        where,
        include: {
          usuario: {
            select: {
              sUsuario: true,
              sNombre: true,
              sApellidoPaterno: true,
              sApellidoMaterno: true
            }
          }
        },
        orderBy: { dFechaHora: 'desc' },
        skip: offset,
        take: parseInt(limit)
      }),
      prisma.BP_07_LOG_AUTENTICACION.count({ where })
    ]);
    
    const totalPages = Math.ceil(totalLogs / parseInt(limit));
    
    // ✅ CORREGIDO: Formatear logs desde la tabla correcta
    const formattedLogs = logs.map(log => ({
      id: log.nId07LogAuth,
      timestamp: log.dFechaHora,
      type: log.sTipoAccion || 'UNKNOWN',
      username: log.usuario ? log.usuario.sUsuario : `Usuario ID: ${log.nId01Usuario}`,
      description: log.sDetalleError || `${log.sTipoAccion} - ${log.bExitoso ? 'Exitoso' : 'Fallido'}`,
      ipAddress: log.sIpUsuario || null,
      success: log.bExitoso,
      device: log.sDispositivo || null,
      userAgent: log.sUserAgent || null
    }));
    
    console.log(`✅ ${formattedLogs.length} logs obtenidos de BP_07_LOG_AUTENTICACION`);
    
    res.json({
      success: true,
      data: {
        logs: formattedLogs,
        currentPage: parseInt(page),
        totalPages,
        totalLogs,
        hasNextPage: parseInt(page) < totalPages,
        hasPrevPage: parseInt(page) > 1
      }
    });
    
  } catch (error) {
    console.error('❌ Error obteniendo logs:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo logs del sistema',
      error: error.message
    });
  }
});

module.exports = router;