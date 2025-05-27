const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const authService = require('../services/authService');

// Obtener estado de la contraseña
exports.getPasswordStatus = async (req, res) => {
    try {
        console.log('Obteniendo estado de contraseña para usuario ID:', req.user.id);
        
        const user = await prisma.bP_01_USUARIO.findUnique({
            where: { nId01Usuario: req.user.id },
            select: { 
                nId01Usuario: true,
                sUsuario: true,
                dFechaUltimoCambioPass: true, 
                dFechaCreacion: true 
            }
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        const ultimoCambio = user.dFechaUltimoCambioPass || user.dFechaCreacion;
        const fechaActual = new Date();
        const diasTranscurridos = Math.floor((fechaActual - new Date(ultimoCambio)) / (1000 * 60 * 60 * 24));
        const diasRestantes = Math.max(0, 180 - diasTranscurridos); // Asegurar que no sea negativo
        const requiereCambio = diasRestantes <= 0;

        console.log(`Estado de contraseña: ${diasTranscurridos} días transcurridos, ${diasRestantes} días restantes`);

        res.json({
            success: true,
            ultimoCambio: ultimoCambio,
            diasRestantes: diasRestantes,
            requiereCambio: requiereCambio
        });
    } catch (error) {
        console.error('Error al obtener estado de contraseña:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener estado de contraseña'
        });
    }
};

// Cambiar contraseña
exports.changePassword = async (req, res) => {
    try {
        console.log('Solicitud de cambio de contraseña para usuario ID:', req.user.id);
        
        const { currentPassword, newPassword } = req.body;
        
        // Obtener usuario usando Prisma (no User.findById que no existe)
        const user = await prisma.bP_01_USUARIO.findUnique({
            where: { nId01Usuario: req.user.id },
            select: {
                nId01Usuario: true,
                sUsuario: true,
                sPassword: true
            }
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        console.log('Usuario encontrado:', user.sUsuario);

        // Verificar contraseña actual
        const isMatch = await bcrypt.compare(currentPassword, user.sPassword);
        if (!isMatch) {
            console.log('Contraseña actual incorrecta');
            
            // Log de intento fallido de cambio de contraseña
            const ip = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'Unknown';
            
            await authService.createAuthLog({
                nId01Usuario: req.user.id,
                sTipoAccion: 'CHANGE_PASSWORD_FAILED',
                sIpUsuario: ip,
                sUserAgent: req.headers['user-agent'] || '',
                sDispositivo: authService.getDeviceInfo(req.headers['user-agent']),
                bExitoso: false,
                sDetalleError: 'Contraseña actual incorrecta'
            });
            
            return res.status(400).json({
                success: false,
                message: 'La contraseña actual es incorrecta'
            });
        }

        // Verificar que la nueva contraseña sea diferente
        const isSamePassword = await bcrypt.compare(newPassword, user.sPassword);
        if (isSamePassword) {
            return res.status(400).json({
                success: false,
                message: 'La nueva contraseña debe ser diferente a la actual'
            });
        }

        console.log('Contraseña actual verificada, procediendo a hashear nueva contraseña...');

        // Encriptar nueva contraseña
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        console.log('Nueva contraseña hasheada, actualizando en base de datos...');

        // Actualizar contraseña y fecha de último cambio
        const updated = await prisma.bP_01_USUARIO.update({
            where: { nId01Usuario: req.user.id },
            data: {
                sPassword: hashedPassword,
                dFechaUltimoCambioPass: new Date(),
                dFechaActualizacion: new Date()
            }
        });
        
        if (!updated) {
            throw new Error('Error al actualizar la contraseña');
        }
        
        console.log('Contraseña actualizada exitosamente en la base de datos');
        
        // Log de cambio de contraseña exitoso
        const ip = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'Unknown';
        
        await authService.createAuthLog({
            nId01Usuario: req.user.id,
            sTipoAcción: 'CHANGE_PASSWORD',
            sIpUsuario: ip,
            sUserAgent: req.headers['user-agent'] || '',
            sDispositivo: authService.getDeviceInfo(req.headers['user-agent']),
            bExitoso: true
        });
        
        // También crear en auditlog
        await prisma.auditlog.create({
            data: {
                userId: req.user.id,
                username: user.sUsuario || req.user.username,
                event: 'PASSWORD_CHANGED',
                ip: ip,
                details: 'Cambio de contraseña exitoso'
            }
        }).catch(err => {
            console.error('Error al crear auditlog:', err);
            // No fallar por esto, es solo logging
        });

        res.json({
            success: true,
            message: 'Contraseña actualizada correctamente'
        });
    } catch (error) {
        console.error('Error al cambiar contraseña:', error);
        res.status(500).json({
            success: false,
            message: 'Error al cambiar contraseña: ' + error.message
        });
    }
};