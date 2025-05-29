// routes/auth.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken } = require('../middlewares/auth');
const prisma = require('../utils/prisma');
const authService = require('../services/authService');


// Rutas públicas de autenticación
router.post('/login', authController.login);
router.get('/login', authController.login);
router.post('/logout', authController.logout);


// Rutas protegidas que requieren autenticación
router.get('/profile', verifyToken, authController.getProfile);

// Nueva ruta para obtener perfiles
router.get('/profiles', verifyToken, async (req, res) => {
    try {
        const perfiles = await prisma.BP_02_PERFIL.findMany({
            include: {
                perfilesPermiso: {
                    include: {
                        permiso: true
                    }
                }
            }
        });

        res.json({
            success: true,
            perfiles: perfiles.map(perfil => ({
                id: perfil.nId02Perfil,
                nombre: perfil.sNombre,
                descripcion: perfil.sDescripcion,
                permisos: perfil.perfilesPermiso.map(pp => ({
                    nombre: pp.permiso.sNombre,
                    descripcion: pp.permiso.sDescripcion,
                    leer: pp.nLeer,
                    crear: pp.nCrear,
                    editar: pp.nEditar,
                    borrar: pp.nBorrar
                }))
            }))
        });
    } catch (error) {
        console.error('Error al obtener perfiles:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener perfiles'
        });
    }
});

// === NUEVAS RUTAS AGREGADAS ===

// Obtener sesiones activas del usuario
router.get('/sessions', verifyToken, async (req, res) => {
    try {
        const sessions = await authService.getActiveSessions(req.user.id);
        res.json({
            success: true,
            sessions: sessions.map(session => ({
                id: session.nId08Sesion,
                fechaInicio: session.dFechaInicio,
                ultimaActividad: session.dFechaUltimaActividad,
                dispositivo: session.sDispositivo,
                ip: session.sIpUsuario,
                activa: session.bActiva
            }))
        });
    } catch (error) {
        console.error('Error al obtener sesiones:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener sesiones activas'
        });
    }
});

// Obtener historial de logins
router.get('/login-history', verifyToken, async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        const logs = await authService.getAuthLogs(req.user.id, limit);
        
        res.json({
            success: true,
            logs: logs.map(log => ({
                id: log.nId07LogAuth,
                tipo: log.sTipoAccion,
                fecha: log.dFechaHora,
                ip: log.sIpUsuario,
                dispositivo: log.sDispositivo,
                exitoso: log.bExitoso,
                error: log.sDetalleError
            }))
        });
    } catch (error) {
        console.error('Error al obtener historial:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener historial de accesos'
        });
    }
});

// Verificar estado de contraseña
router.get('/password-status', verifyToken, async (req, res) => {
    try {
        const status = await authService.checkPasswordExpiry(req.user.id);
        
        if (!status) {
            return res.status(500).json({
                success: false,
                message: 'Error al verificar estado de contraseña'
            });
        }
        
        res.json({
            success: true,
            caducada: status.caducada,
            diasRestantes: status.diasRestantes,
            requiereCambio: status.caducada,
            mensaje: status.caducada 
                ? 'Su contraseña ha caducado. Por favor, cámbiela.'
                : status.diasRestantes <= 7 
                    ? `Su contraseña expirará en ${status.diasRestantes} días`
                    : null
        });
    } catch (error) {
        console.error('Error al verificar estado de contraseña:', error);
        res.status(500).json({
            success: false,
            message: 'Error al verificar estado de contraseña'
        });
    }
});

// Cerrar todas las sesiones
router.post('/close-all-sessions', verifyToken, async (req, res) => {
    try {
        // Obtener el token actual
        const currentToken = req.headers.authorization?.replace('Bearer ', '') || req.header('x-auth-token');
        
        // Desactivar todas las sesiones del usuario
        await prisma.bP_08_SESION_ACTIVA.updateMany({
            where: {
                nId01Usuario: req.user.id,
                bActiva: true
            },
            data: {
                bActiva: false
            }
        });
        
        // Reactivar solo la sesión actual si existe
        if (currentToken) {
            await prisma.bP_08_SESION_ACTIVA.updateMany({
                where: {
                    sTokenSesion: currentToken
                },
                data: {
                    bActiva: true
                }
            });
        }
        
        res.json({
            success: true,
            message: 'Todas las demás sesiones han sido cerradas'
        });
    } catch (error) {
        console.error('Error al cerrar sesiones:', error);
        res.status(500).json({
            success: false,
            message: 'Error al cerrar sesiones'
        });
    }
});

module.exports = router;