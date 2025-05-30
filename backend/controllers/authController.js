// controllers/authController.js - CON LOGGING USANDO TU authService EXISTENTE
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../utils/prisma');
const authService = require('../services/authService'); // ← TU authService EXISTENTE

exports.login = async (req, res, next) => {
    try {
        console.log('Login request received:', req.body);
        const { username, password } = req.body;
        console.log('🔍 Username recibido:', username);
        
        const ip = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
        
        // USUARIO DE PRUEBA HANS - SIEMPRE DISPONIBLE
        if (username.toUpperCase() === 'HANS' && password === '12345') {
            console.log('✅ Login de prueba para HANS (ID: 5951)');
            
            const token = jwt.sign(
                { 
                    id: 5951, 
                    username: 'HANS', 
                    role: 'ADMIN',
                    originalId: 5951,
                    idCliente: 5951  // ✅ AGREGAR idCliente
                },
                process.env.JWT_SECRET || 'clave_secreta_para_jwt',
                { expiresIn: process.env.JWT_EXPIRE || '24h' }
            );
            
            // 🔥 REGISTRAR LOG DE LOGIN EXITOSO USANDO TU authService
            try {
                await authService.createAuthLog({
                    nId01Usuario: 5951,
                    sTipoAccion: 'LOGIN',
                    dFechaHora: new Date(),
                    sIpUsuario: (ip || 'unknown').substring(0, 50),
                    sUserAgent: (req.headers['user-agent'] || '').substring(0, 500),
                    sDispositivo: authService.getDeviceInfo(req.headers['user-agent']),
                    sUbicacion: null,
                    bExitoso: true,
                    sDetalleError: null,
                    sTokenSesion: token.substring(0, 255)
                });
                console.log('✅ Log de autenticación guardado para HANS');
            } catch (logError) {
                console.error('⚠️ Error al guardar log:', logError);
            }
            
            // 🔥 CREAR SESIÓN ACTIVA USANDO TU authService
            try {
                await authService.createActiveSession(5951, token, req);
                console.log('✅ Sesión activa creada para HANS');
            } catch (sessionError) {
                console.error('⚠️ Error al crear sesión:', sessionError);
            }
            
            return res.status(200).json({
                success: true,
                message: 'Login exitoso',
                token: token,
                user: {
                    id: 5951,
                    username: 'HANS',
                    name: 'Hans Hansen Mojica',
                    role: 'ADMIN',
                    email: 'hans@hotmail.com',
                    idCliente: 5951  // ✅ AGREGAR idCliente en respuesta
                }
            });
        }
        
        // Buscar usuario en la base de datos utilizando Prisma
        console.log('Buscando usuario en base de datos:', username);
        
        let user;
        try {
            user = await prisma.BP_01_USUARIO.findUnique({
                where: { 
                    sUsuario: username.toUpperCase()
                },
                include: {
                    perfilesUsuario: {
                        include: {
                            perfil: true
                        }
                    }
                }
            });
        } catch (dbError) {
            console.error('❌ Error de base de datos:', dbError);
            
            // 🔥 REGISTRAR LOG DE LOGIN FALLIDO POR ERROR DE BD
            try {
                await authService.createAuthLog({
                    nId01Usuario: null,
                    sTipoAccion: 'LOGIN_FAILED',
                    dFechaHora: new Date(),
                    sIpUsuario: (ip || 'unknown').substring(0, 50),
                    sUserAgent: (req.headers['user-agent'] || '').substring(0, 500),
                    sDispositivo: authService.getDeviceInfo(req.headers['user-agent']),
                    sUbicacion: null,
                    bExitoso: false,
                    sDetalleError: 'Error de conexión a BD',
                    sTokenSesion: null
                });
            } catch (logError) {
                console.error('⚠️ Error al guardar log de error BD:', logError);
            }
            
            // Fallback para HANS en caso de error de BD
            if (username.toUpperCase() === 'HANS' && password === '12345') {
                console.log('⚠️ Error de BD, usando fallback para HANS');
                const token = jwt.sign(
                    { 
                        id: 5951, 
                        username: 'HANS', 
                        role: 'ADMIN',
                        originalId: 5951,
                        idCliente: 5951  // ✅ AGREGAR idCliente
                    },
                    process.env.JWT_SECRET || 'clave_secreta_para_jwt',
                    { expiresIn: process.env.JWT_EXPIRE || '24h' }
                );
                
                // 🔥 REGISTRAR LOG DE FALLBACK
                try {
                    await authService.createAuthLog({
                        nId01Usuario: 5951,
                        sTipoAccion: 'LOGIN',
                        dFechaHora: new Date(),
                        sIpUsuario: (ip || 'unknown').substring(0, 50),
                        sUserAgent: (req.headers['user-agent'] || '').substring(0, 500),
                        sDispositivo: authService.getDeviceInfo(req.headers['user-agent']),
                        sUbicacion: null,
                        bExitoso: true,
                        sDetalleError: 'Fallback por error BD',
                        sTokenSesion: token.substring(0, 255)
                    });
                    await authService.createActiveSession(5951, token, req);
                } catch (logError) {
                    console.error('⚠️ Error al guardar log de fallback:', logError);
                }
                
                return res.status(200).json({
                    success: true,
                    message: 'Login exitoso (fallback)',
                    token: token,
                    user: {
                        id: 5951,
                        username: 'HANS',
                        name: 'Hans Hansen Mojica',
                        role: 'ADMIN',
                        email: 'hans@hotmail.com',
                        idCliente: 5951  // ✅ AGREGAR idCliente en respuesta
                    }
                });
            }
            
            return res.status(500).json({
                success: false,
                message: 'Error de conexión a la base de datos'
            });
        }
        
        console.log('Usuario encontrado:', user ? `ID: ${user.nId01Usuario}, Activo: ${user.bActivo}` : 'No encontrado');
        
        // Verificar si existe el usuario
        if (!user) {
            // 🔥 REGISTRAR LOG DE LOGIN FALLIDO - USUARIO NO ENCONTRADO
            try {
                await authService.createAuthLog({
                    nId01Usuario: null,
                    sTipoAccion: 'LOGIN_FAILED',
                    dFechaHora: new Date(),
                    sIpUsuario: (ip || 'unknown').substring(0, 50),
                    sUserAgent: (req.headers['user-agent'] || '').substring(0, 500),
                    sDispositivo: authService.getDeviceInfo(req.headers['user-agent']),
                    sUbicacion: null,
                    bExitoso: false,
                    sDetalleError: 'Usuario no encontrado',
                    sTokenSesion: null
                });
            } catch (logError) {
                console.error('⚠️ Error al guardar log de usuario no encontrado:', logError);
            }
            
            return res.status(401).json({
                success: false,
                message: 'Credenciales incorrectas'
            });
        }
        
        // Verificar contraseña
        const passwordValid = await bcrypt.compare(password, user.sPassword);
        console.log('Verificación de contraseña:', passwordValid ? 'Correcta' : 'Incorrecta');
        
        if (!passwordValid) {
            // 🔥 REGISTRAR LOG DE LOGIN FALLIDO - CONTRASEÑA INCORRECTA
            try {
                await authService.createAuthLog({
                    nId01Usuario: user.nId01Usuario,
                    sTipoAccion: 'LOGIN_FAILED',
                    dFechaHora: new Date(),
                    sIpUsuario: (ip || 'unknown').substring(0, 50),
                    sUserAgent: (req.headers['user-agent'] || '').substring(0, 500),
                    sDispositivo: authService.getDeviceInfo(req.headers['user-agent']),
                    sUbicacion: null,
                    bExitoso: false,
                    sDetalleError: 'Contraseña incorrecta',
                    sTokenSesion: null
                });
            } catch (logError) {
                console.error('⚠️ Error al guardar log de contraseña incorrecta:', logError);
            }
            
            return res.status(401).json({
                success: false,
                message: 'Credenciales incorrectas'
            });
        }
        
        // Verificar si el usuario está activo
        if (!user.bActivo) {
            // 🔥 REGISTRAR LOG DE LOGIN FALLIDO - USUARIO INACTIVO
            try {
                await authService.createAuthLog({
                    nId01Usuario: user.nId01Usuario,
                    sTipoAccion: 'LOGIN_FAILED',
                    dFechaHora: new Date(),
                    sIpUsuario: (ip || 'unknown').substring(0, 50),
                    sUserAgent: (req.headers['user-agent'] || '').substring(0, 500),
                    sDispositivo: authService.getDeviceInfo(req.headers['user-agent']),
                    sUbicacion: null,
                    bExitoso: false,
                    sDetalleError: 'Usuario inactivo',
                    sTokenSesion: null
                });
            } catch (logError) {
                console.error('⚠️ Error al guardar log de usuario inactivo:', logError);
            }
            
            return res.status(401).json({
                success: false,
                message: 'Usuario inactivo. Contacte al administrador.'
            });
        }
        
        // Obtener el perfil del usuario
        const perfil = user.perfilesUsuario[0]?.perfil?.sNombre || 'USER';
        
        // MAPEO ESPECIAL PARA USUARIOS CON IDs PERSONALIZADOS
         let clienteId = user.nIdCliente || user.nId01Usuario;  // ✅ Correcto
        
        // Si es HANS desde la BD, usar el ID 5951 para las referencias
        if (user.sUsuario.toUpperCase() === 'HANS') {
            clienteId = 5951;
            console.log('✅ Mapeando HANS de BD (ID original: ' + user.nId01Usuario + ') a ID cliente: 5951');
        }
        
        // Generar token JWT
        const token = jwt.sign(
            { 
                id: clienteId,
                username: user.sUsuario,
                role: perfil,
                originalId: user.nId01Usuario,
                idCliente: clienteId  // ✅ AGREGAR idCliente
            },
            process.env.JWT_SECRET || 'clave_secreta_para_jwt',
            { expiresIn: process.env.JWT_EXPIRE || '8h' }
        );
        
        // 🔥 REGISTRAR LOG DE LOGIN EXITOSO
        try {
            await authService.createAuthLog({
                nId01Usuario: user.nId01Usuario,
                sTipoAccion: 'LOGIN',
                dFechaHora: new Date(),
                sIpUsuario: (ip || 'unknown').substring(0, 50),
                sUserAgent: (req.headers['user-agent'] || '').substring(0, 500),
                sDispositivo: authService.getDeviceInfo(req.headers['user-agent']),
                sUbicacion: null,
                bExitoso: true,
                sDetalleError: null,
                sTokenSesion: token.substring(0, 255)
            });
            console.log('✅ Log de autenticación guardado para:', user.sUsuario);
        } catch (logError) {
            console.error('⚠️ Error al guardar log de login exitoso:', logError);
        }
        
        // 🔥 CREAR SESIÓN ACTIVA
        try {
            await authService.createActiveSession(user.nId01Usuario, token, req);
            console.log('✅ Sesión activa creada para:', user.sUsuario);
        } catch (sessionError) {
            console.error('⚠️ Error al crear sesión activa:', sessionError);
        }
        
        console.log('✅ Login exitoso para:', user.sUsuario);
        console.log('✅ ID Cliente para referencias:', clienteId);
        console.log('✅ Logs de autenticación registrados');
        
        // Responder con datos del usuario y token
        return res.status(200).json({
            success: true,
            message: 'Login exitoso',
            token,
            user: {
                id: clienteId,
                username: user.sUsuario,
                name: `${user.sNombre} ${user.sApellidoPaterno} ${user.sApellidoMaterno}`,
                role: perfil,
                email: user.sEmail,
                image: user.sUsuarioImg,
                idCliente: clienteId  // ✅ AGREGAR idCliente en respuesta
            }
        });
    } catch (error) {
        console.error('❌ Error en login:', error);
        
        // 🔥 REGISTRAR LOG DE ERROR GENERAL
        try {
            await authService.createAuthLog({
                nId01Usuario: null,
                sTipoAccion: 'LOGIN_FAILED',
                dFechaHora: new Date(),
                sIpUsuario: (req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown').substring(0, 50),
                sUserAgent: (req.headers['user-agent'] || '').substring(0, 500),
                sDispositivo: authService.getDeviceInfo(req.headers['user-agent']),
                sUbicacion: null,
                bExitoso: false,
                sDetalleError: `Error interno: ${error.message}`,
                sTokenSesion: null
            });
        } catch (logError) {
            console.error('⚠️ Error al guardar log de error general:', logError);
        }
        
        // Fallback final para HANS
        if (req.body.username?.toUpperCase() === 'HANS' && req.body.password === '12345') {
            console.log('⚠️ Error general, usando fallback final para HANS');
            const token = jwt.sign(
                { 
                    id: 5951, 
                    username: 'HANS', 
                    role: 'ADMIN',
                    originalId: 5951,
                    idCliente: 5951  // ✅ AGREGAR idCliente
                },
                process.env.JWT_SECRET || 'clave_secreta_para_jwt',
                { expiresIn: process.env.JWT_EXPIRE || '24h' }
            );
            
            // 🔥 REGISTRAR LOG DE FALLBACK FINAL
            try {
                await authService.createAuthLog({
                    nId01Usuario: 5951,
                    sTipoAccion: 'LOGIN',
                    dFechaHora: new Date(),
                    sIpUsuario: (req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown').substring(0, 50),
                    sUserAgent: (req.headers['user-agent'] || '').substring(0, 500),
                    sDispositivo: authService.getDeviceInfo(req.headers['user-agent']),
                    sUbicacion: null,
                    bExitoso: true,
                    sDetalleError: 'Fallback por error general',
                    sTokenSesion: token.substring(0, 255)
                });
                await authService.createActiveSession(5951, token, req);
            } catch (logError) {
                console.error('⚠️ Error al guardar log de fallback final:', logError);
            }
            
            return res.status(200).json({
                success: true,
                message: 'Login exitoso (modo emergencia)',
                token: token,
                user: {
                    id: 5951,
                    username: 'HANS',
                    name: 'Hans Hansen Mojica',
                    role: 'ADMIN',
                    idCliente: 5951  // ✅ AGREGAR idCliente en respuesta
                }
            });
        }
        
        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};

exports.logout = async (req, res) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '') || 
                      req.header('x-auth-token');
        
        if (req.user && req.user.originalId) {
            // 🔥 REGISTRAR LOGOUT USANDO TU authService
            try {
                await authService.createAuthLog({
                    nId01Usuario: req.user.originalId,
                    sTipoAccion: 'LOGOUT',
                    dFechaHora: new Date(),
                    sIpUsuario: (req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown').substring(0, 50),
                    sUserAgent: (req.headers['user-agent'] || '').substring(0, 500),
                    sDispositivo: authService.getDeviceInfo(req.headers['user-agent']),
                    sUbicacion: null,
                    bExitoso: true,
                    sDetalleError: null,
                    sTokenSesion: token ? token.substring(0, 255) : null
                });
                console.log('✅ Logout registrado para usuario:', req.user.originalId);
            } catch (logError) {
                console.error('⚠️ Error al guardar log de logout:', logError);
            }
            
            // 🔥 DESACTIVAR SESIÓN
            if (token) {
                try {
                    await authService.deactivateSession(token);
                    console.log('✅ Sesión desactivada');
                } catch (sessionError) {
                    console.error('⚠️ Error al desactivar sesión:', sessionError);
                }
            }
        }
        
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
        // Para HANS de prueba, devolver datos directamente
        if (req.user.username === 'HANS' && req.user.id === 5951) {
            return res.status(200).json({
                success: true,
                user: {
                    id: 5951,
                    username: 'HANS',
                    name: 'Hans Hansen Mojica',
                    email: 'hans@hotmail.com',
                    role: 'ADMIN',
                    active: true,
                    createdAt: new Date().toISOString(),
                    idCliente: 5951  // ✅ AGREGAR idCliente en respuesta
                }
            });
        }
        
        const userId = req.user.originalId || req.user.id;
        
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
        
        let clienteId = user.nId01Usuario;
        if (user.sUsuario.toUpperCase() === 'HANS') {
            clienteId = 5951;
        }
        
        res.status(200).json({
            success: true,
            user: {
                id: clienteId,
                username: user.sUsuario,
                name: `${user.sNombre} ${user.sApellidoPaterno} ${user.sApellidoMaterno}`,
                email: user.sEmail,
                role: perfil,
                image: user.sUsuarioImg,
                active: user.bActivo,
                createdAt: user.dFechaCreacion,
                idCliente: clienteId  // ✅ AGREGAR idCliente en respuesta
            }
        });
    } catch (error) {
        console.error('Error al obtener perfil:', error);
        next(error);
    }
};