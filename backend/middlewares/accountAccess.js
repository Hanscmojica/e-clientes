const prisma = require('../utils/prisma');

// Middleware para verificar si un ejecutivo puede acceder a la cuenta de un cliente
const canAccessClientAccount = async (req, res, next) => {
    try {
        const executiveId = req.user.id;
        const clientId = parseInt(req.params.clientId || req.body.clientId);

        if (!clientId) {
            return res.status(400).json({
                success: false,
                message: 'ID de cliente no proporcionado'
            });
        }

        // Verificar si el usuario es un ejecutivo de cuenta
        const userProfile = await prisma.BP_04_PERFIL_USUARIO.findFirst({
            where: {
                nId01Usuario: executiveId
            },
            include: {
                perfil: true
            }
        });

        if (!userProfile || userProfile.perfil.sNombre !== 'EJECUTIVO_CUENTA') {
            return res.status(403).json({
                success: false,
                message: 'No tiene permisos de ejecutivo de cuenta'
            });
        }

        // Verificar si tiene el permiso específico
        const hasPermission = await prisma.BP_05_PERFIL_PERMISO.findFirst({
            where: {
                nId02Perfil: userProfile.nId02Perfil,
                permiso: {
                    sNombre: 'ACCESO_CUENTA_CLIENTE'
                },
                nLeer: true
            }
        });

        if (!hasPermission) {
            return res.status(403).json({
                success: false,
                message: 'No tiene permiso para acceder a cuentas de clientes'
            });
        }

        // TODO: Aquí se podría agregar una verificación adicional para asegurarse
        // de que el ejecutivo está asignado específicamente a este cliente
        // Por ejemplo, mediante una tabla de relación ejecutivo-cliente

        // Si todo está bien, permitir el acceso
        next();

    } catch (error) {
        console.error('Error al verificar acceso a cuenta de cliente:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno al verificar acceso'
        });
    }
};

// Middleware para impersonar a un cliente
const impersonateClient = async (req, res, next) => {
    try {
        const clientId = parseInt(req.params.clientId || req.body.clientId);
        
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
            },
            include: {
                perfilesUsuario: {
                    include: {
                        perfil: true
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

        // Guardar información original del ejecutivo
        req.originalUser = req.user;

        // Reemplazar información del usuario en el request con la del cliente
        req.user = {
            id: client.nId01Usuario,
            username: client.sUsuario,
            role: 'CLIENTE',
            permisos: client.perfilesUsuario[0]?.perfil?.perfilesPermiso?.map(p => ({
                nombre: p.permiso.sNombre,
                leer: p.nLeer,
                crear: p.nCrear,
                editar: p.nEditar,
                borrar: p.nBorrar
            })) || []
        };

        next();

    } catch (error) {
        console.error('Error al impersonar cliente:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno al impersonar cliente'
        });
    }
};

module.exports = {
    canAccessClientAccount,
    impersonateClient
}; 