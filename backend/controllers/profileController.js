const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const authService = require('../services/authService');

// Obtener estado de la contraseña
exports.getPasswordStatus = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        const ultimoCambio = user.dFechaUltimoCambioPass || user.dFechaCreacion;
        const fechaActual = new Date();
        const diasTranscurridos = Math.floor((fechaActual - new Date(ultimoCambio)) / (1000 * 60 * 60 * 24));
        const diasRestantes = 180 - diasTranscurridos;
        const requiereCambio = diasRestantes <= 0;

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
        const { currentPassword, newPassword } = req.body;
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        // Verificar contraseña actual
        const isMatch = await bcrypt.compare(currentPassword, user.sPassword);
        if (!isMatch) {
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

        // Encriptar nueva contraseña
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

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
        
        // Log de cambio de contraseña exitoso
        const ip = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'Unknown';
        
        await authService.createAuthLog({
            nId01Usuario: req.user.id,
            sTipoAccion: 'CHANGE_PASSWORD',
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
        }).catch(console.error);

        res.json({
            success: true,
            message: 'Contraseña actualizada correctamente'
        });
    } catch (error) {
        console.error('Error al cambiar contraseña:', error);
        res.status(500).json({
            success: false,
            message: 'Error al cambiar contraseña'
        });
    }
};