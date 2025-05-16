const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/auth');
const prisma = require('../utils/prisma');

// Obtener lista de clientes asignados al ejecutivo
router.get('/my-clients', verifyToken, async (req, res) => {
    try {
        // Verificar que el usuario sea un ejecutivo de cuenta
        const userProfile = await prisma.BP_04_PERFIL_USUARIO.findFirst({
            where: {
                nId01Usuario: req.user.id,
                perfil: {
                    sNombre: 'EJECUTIVO_CUENTA'
                }
            }
        });

        if (!userProfile) {
            return res.status(403).json({
                success: false,
                message: 'No tiene permisos de ejecutivo de cuenta'
            });
        }

        // Obtener todos los usuarios con perfil CLIENTE
        const clients = await prisma.BP_01_USUARIO.findMany({
            where: {
                perfilesUsuario: {
                    some: {
                        perfil: {
                            sNombre: 'CLIENTE'
                        }
                    }
                }
            },
            select: {
                nId01Usuario: true,
                sNombre: true,
                sApellidoPaterno: true,
                sApellidoMaterno: true,
                sUsuario: true,
                sEmail: true,
                bActivo: true
            }
        });

        res.json({
            success: true,
            clients
        });

    } catch (error) {
        console.error('Error al obtener lista de clientes:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// Acceder a la cuenta de un cliente específico
router.post('/access-client/:clientId', verifyToken, async (req, res) => {
    try {
        const executiveId = req.user.id;
        const clientId = parseInt(req.params.clientId);

        // Verificar que el usuario sea un ejecutivo
        const executiveProfile = await prisma.BP_04_PERFIL_USUARIO.findFirst({
            where: {
                nId01Usuario: executiveId,
                perfil: {
                    sNombre: 'EJECUTIVO_CUENTA'
                }
            }
        });

        if (!executiveProfile) {
            return res.status(403).json({
                success: false,
                message: 'No tiene permisos de ejecutivo de cuenta'
            });
        }

        // Buscar el cliente
        const client = await prisma.BP_01_USUARIO.findFirst({
            where: {
                nId01Usuario: clientId,
                perfilesUsuario: {
                    some: {
                        perfil: {
                            sNombre: 'CLIENTE'
                        }
                    }
                }
            }
        });

        if (!client) {
            return res.status(404).json({
                success: false,
                message: 'Cliente no encontrado'
            });
        }

        // Guardar la sesión del ejecutivo
        req.session = {
            originalUser: req.user,
            clientId: clientId
        };

        res.json({
            success: true,
            message: 'Acceso a cuenta de cliente concedido',
            clientInfo: {
                id: client.nId01Usuario,
                username: client.sUsuario,
                nombre: `${client.sNombre} ${client.sApellidoPaterno} ${client.sApellidoMaterno}`
            }
        });

    } catch (error) {
        console.error('Error al acceder a cuenta de cliente:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// Finalizar acceso a la cuenta del cliente
router.post('/end-client-access', verifyToken, async (req, res) => {
    try {
        if (!req.session?.originalUser) {
            return res.status(400).json({
                success: false,
                message: 'No hay una sesión de cliente activa'
            });
        }

        const originalUser = req.session.originalUser;
        delete req.session;

        res.json({
            success: true,
            message: 'Sesión de cliente finalizada',
            executiveInfo: {
                id: originalUser.id,
                username: originalUser.username
            }
        });

    } catch (error) {
        console.error('Error al finalizar acceso a cuenta de cliente:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

module.exports = router; 