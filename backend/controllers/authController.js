// controllers/authController.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../utils/prisma');
const { logAudit } = require('../utils/audit');
const authService = require('../services/authService');

exports.login = async (req, res, next) => {
    try {
        console.log('Login request received:', req.body);
        const { username, password } = req.body;
        const ip = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
        
        // Forzar modo desarrollo para pruebas
        // Para este usuario específico, permitir acceso directo
        if (username === 'HANS' && password === '12345') {
            console.log('Modo de prueba para HANS activado - Acceso directo!');
            
            // Generar token para HANS
            const token = jwt.sign(
                { id: 5, username: 'HANS', role: 'ADMIN' },
                process.env.JWT_SECRET || 'clave_secreta_para_jwt',
                { expiresIn: '24h' }
            );
            
            // Crear sesión activa para HANS
            await authService.createActiveSession(5, token, req);
            
            // Log de login exitoso
            await authService.createAuthLog({
                nId01Usuario: 5,
                sTipoAccion: 'LOGIN',
                sIpUsuario: ip,
                sUserAgent: req.headers['user-agent'] || '',
                sDispositivo: authService.getDeviceInfo(req.headers['user-agent']),
                bExitoso: true,
                sTokenSesion: token
            });
            
            await logAudit({ userId: 5, username: 'HANS', event: 'login', ip });
            
            return res.status(200).json({
                success: true,
                message: 'Login exitoso en modo prueba',
                token: token,
                user: {
                    id: 5,
                    username: 'HANS',
                    name: 'Hans Hansen Mojica',
                    role: 'ADMIN'
                }
            });
        }
        
        // Para modo de prueba, usar usuario y contraseña fijos
        if (process.env.NODE_ENV === 'development') {
            if (username === 'usuario' && password === 'password123') {
                console.log('Usando credenciales de desarrollo');
                
                const token = jwt.sign(
                    { id: 0, username: 'usuario', role: 'USER' },
                    process.env.JWT_SECRET || 'clave_secreta_para_jwt',
                    { expiresIn: '24h' }
                );
                
                await authService.createActiveSession(0, token, req);
                await logAudit({ userId: 0, username: 'usuario', event: 'login', ip });
                
                return res.status(200).json({
                    success: true,
                    message: 'Login exitoso',
                    token: token,
                    user: {
                        id: 0,
                        username: 'usuario',
                        name: 'Usuario de Prueba',
                        role: 'USER'
                    }
                });
            }
        }
        
        // Buscar usuario en la base de datos utilizando Prisma
        console.log('Buscando usuario en base de datos:', username);
        const user = await prisma.BP_01_USUARIO.findUnique({
            where: { 
                sUsuario: username 
            },
            include: {
                perfilesUsuario: {
                    include: {
                        perfil: true
                    }
                }
            }
        });
        
        console.log('Usuario encontrado:', user ? `ID: ${user.nId01Usuario}, Activo: ${user.bActivo}` : 'No encontrado');
        
        // Verificar si existe el usuario y la contraseña es correcta
        if (!user) {
            // Log de intento fallido
            await authService.createAuthLog({
                nId01Usuario: 1, // ID genérico para usuarios no encontrados
                sTipoAccion: 'LOGIN_FAILED',
                sIpUsuario: ip,
                sUserAgent: req.headers['user-agent'] || '',
                sDispositivo: authService.getDeviceInfo(req.headers['user-agent']),
                bExitoso: false,
                sDetalleError: 'Usuario no encontrado'
            });
            
            await logAudit({ username, event: 'failed_login', ip, details: 'Credenciales incorrectas' });
            return res.status(401).json({
                success: false,
                message: 'Credenciales incorrectas - Usuario no encontrado'
            });
        }
        
        // Verificar contraseña
        const passwordValid = await bcrypt.compare(password, user.sPassword);
        console.log('Verificación de contraseña:', passwordValid ? 'Correcta' : 'Incorrecta');
        
        if (!passwordValid) {
            // Log de intento fallido
            await authService.createAuthLog({
                nId01Usuario: user.nId01Usuario,
                sTipoAccion: 'LOGIN_FAILED',
                sIpUsuario: ip,
                sUserAgent: req.headers['user-agent'] || '',
                sDispositivo: authService.getDeviceInfo(req.headers['user-agent']),
                bExitoso: false,
                sDetalleError: 'Contraseña incorrecta'
            });
            
            await logAudit({ username, event: 'failed_login', ip, details: 'Credenciales incorrectas' });
            return res.status(401).json({
                success: false,
                message: 'Credenciales incorrectas - Contraseña inválida'
            });
        }
        
        // Verificar si el usuario está activo
        if (!user.bActivo) {
            // Log de intento fallido
            await authService.createAuthLog({
                nId01Usuario: user.nId01Usuario,
                sTipoAccion: 'LOGIN_FAILED',
                sIpUsuario: ip,
                sUserAgent: req.headers['user-agent'] || '',
                sDispositivo: authService.getDeviceInfo(req.headers['user-agent']),
                bExitoso: false,
                sDetalleError: 'Usuario inactivo'
            });
            
            await logAudit({ userId: user.nId01Usuario, username: user.sUsuario, event: 'failed_login', ip, details: 'Usuario inactivo' });
            return res.status(401).json({
                success: false,
                message: 'Usuario inactivo. Contacte al administrador.'
            });
        }
        
        // Obtener el perfil del usuario
        const perfil = user.perfilesUsuario[0]?.perfil?.sNombre || 'USER';
        
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
        
        // === NUEVAS FUNCIONALIDADES ===
        
        // Verificar caducidad de contraseña
        const passwordStatus = await authService.checkPasswordExpiry(user.nId01Usuario);
        if (passwordStatus && passwordStatus.caducada) {
            // Log de intento con contraseña caducada
            await authService.createAuthLog({
                nId01Usuario: user.nId01Usuario,
                sTipoAccion: 'LOGIN_FAILED',
                sIpUsuario: ip,
                sUserAgent: req.headers['user-agent'] || '',
                sDispositivo: authService.getDeviceInfo(req.headers['user-agent']),
                bExitoso: false,
                sDetalleError: 'Contraseña caducada'
            });
            
            return res.status(403).json({
                success: false,
                requirePasswordChange: true,
                message: 'Su contraseña ha caducado. Por favor, cámbiela.',
                diasTranscurridos: passwordStatus.diasTranscurridos
            });
        }
        
        // Crear sesión activa
        await authService.createActiveSession(user.nId01Usuario, token, req);
        
        // Log de login exitoso
        await authService.createAuthLog({
            nId01Usuario: user.nId01Usuario,
            sTipoAccion: 'LOGIN',
            sIpUsuario: ip,
            sUserAgent: req.headers['user-agent'] || '',
            sDispositivo: authService.getDeviceInfo(req.headers['user-agent']),
            bExitoso: true,
            sTokenSesion: token
        });
        
        // === FIN NUEVAS FUNCIONALIDADES ===
        
        await logAudit({ userId: user.nId01Usuario, username: user.sUsuario, event: 'login', ip });
        
        // Responder con datos del usuario y token
        return res.status(200).json({
            success: true,
            message: 'Login exitoso',
            token,
            user: {
                id: user.nId01Usuario,
                username: user.sUsuario,
                name: `${user.sNombre} ${user.sApellidoPaterno} ${user.sApellidoMaterno}`,
                role: perfil,
                image: user.sUsuarioImg
            }
        });
    } catch (error) {
        console.error('Error en login:', error);
        await logAudit({ username: req.body.username, event: 'failed_login', ip: req.ip, details: error.message });
        next(error);
    }
};

exports.logout = async (req, res) => {
    try {
        const user = req.user;
        const token = req.headers.authorization?.replace('Bearer ', '') || req.header('x-auth-token');
        const ip = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
        
        // Desactivar sesión activa
        if (token) {
            await authService.deactivateSession(token);
        }
        
        // Log de logout
        await authService.createAuthLog({
            nId01Usuario: user?.id || 0,
            sTipoAccion: 'LOGOUT',
            sIpUsuario: ip,
            sUserAgent: req.headers['user-agent'] || '',
            sDispositivo: authService.getDeviceInfo(req.headers['user-agent']),
            bExitoso: true,
            sTokenSesion: token
        });
        
        // Log en auditlog existente
        await logAudit({ 
            userId: user?.id, 
            username: user?.username, 
            event: 'logout', 
            ip 
        }).catch(console.error);
        
        res.status(200).json({
            success: true,
            message: 'Sesión cerrada correctamente'
        });
    } catch (error) {
        console.error('Error en logout:', error);
        res.status(500).json({
            success: false,
            message: 'Error al cerrar sesión'
        });
    }
};

exports.getProfile = async (req, res, next) => {
    try {
        // req.user es establecido por el middleware de autenticación
        const userId = req.user.id;
        
        const user = await prisma.BP_01_USUARIO.findUnique({
            where: { 
                nId01Usuario: userId 
            },
            include: {
                perfilesUsuario: {
                    include: {
                        perfil: true
                    }
                }
            }
        });
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }
        
        const perfil = user.perfilesUsuario[0]?.perfil?.sNombre || 'USER';
        
        res.status(200).json({
            success: true,
            user: {
                id: user.nId01Usuario,
                username: user.sUsuario,
                name: `${user.sNombre} ${user.sApellidoPaterno} ${user.sApellidoMaterno}`,
                email: user.sEmail,
                role: perfil,
                image: user.sUsuarioImg,
                active: user.bActivo,
                createdAt: user.dFechaCreacion
            }
        });
    } catch (error) {
        console.error('Error al obtener perfil:', error);
        next(error);
    }
};