// controllers/authController.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../utils/prisma');
const { logAudit } = require('../utils/audit');

exports.login = async (req, res, next) => {
    try {
        console.log('Login request received:', req.body);
        const { username, password } = req.body;
        console.log('🔍 Username recibido:', username);
        console.log('🔍 Password recibido:', password);
        console.log('🔍 Username uppercase:', username.toUpperCase());
        console.log('🔍 Comparación username:', username.toUpperCase() === 'HANS');
         
        console.log('🔍 Comparación password:', password === '12345');
        const ip = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
        
        // USUARIO DE PRUEBA HANS - SIEMPRE DISPONIBLE
        if (username.toUpperCase() === 'HANS' && password === '12345') {
            console.log('✅ Login de prueba para HANS (ID: 5951)');
            
            const token = jwt.sign(
                { id: 5951, username: 'HANS', role: 'ADMIN' },
                process.env.JWT_SECRET || 'clave_secreta_para_jwt',
                { expiresIn: process.env.JWT_EXPIRE || '24h' }
            );
            
            return res.status(200).json({
                success: true,
                message: 'Login exitoso',
                token: token,
                user: {
                    id: 5951,
                    username: 'HANS',
                    name: 'Hans Hansen Mojica',
                    role: 'ADMIN',
                    email: 'hans@hotmail.com'
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
            
            // Fallback para HANS en caso de error de BD
            if (username.toUpperCase() === 'HANS' && password === '12345') {
                console.log('⚠️ Error de BD, usando fallback para HANS');
                const token = jwt.sign(
                    { id: 5951, username: 'HANS', role: 'ADMIN' },
                    process.env.JWT_SECRET || 'clave_secreta_para_jwt',
                    { expiresIn: process.env.JWT_EXPIRE || '24h' }
                );
                
                return res.status(200).json({
                    success: true,
                    message: 'Login exitoso (fallback)',
                    token: token,
                    user: {
                        id: 5951,
                        username: 'HANS',
                        name: 'Hans Hansen Mojica',
                        role: 'ADMIN',
                        email: 'hans@hotmail.com'
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
            return res.status(401).json({
                success: false,
                message: 'Credenciales incorrectas'
            });
        }
        
        // Verificar contraseña
        const passwordValid = await bcrypt.compare(password, user.sPassword);
        console.log('Verificación de contraseña:', passwordValid ? 'Correcta' : 'Incorrecta');
        
        if (!passwordValid) {
            return res.status(401).json({
                success: false,
                message: 'Credenciales incorrectas'
            });
        }
        
        // Verificar si el usuario está activo
        if (!user.bActivo) {
            return res.status(401).json({
                success: false,
                message: 'Usuario inactivo. Contacte al administrador.'
            });
        }
        
        // Obtener el perfil del usuario
        const perfil = user.perfilesUsuario[0]?.perfil?.sNombre || 'USER';
        
        // MAPEO ESPECIAL PARA USUARIOS CON IDs PERSONALIZADOS
        let clienteId = user.nId01Usuario;
        
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
                originalId: user.nId01Usuario
            },
            process.env.JWT_SECRET || 'clave_secreta_para_jwt',
            { expiresIn: process.env.JWT_EXPIRE || '8h' }
        );
        
        console.log('✅ Login exitoso para:', user.sUsuario);
        console.log('✅ ID Cliente para referencias:', clienteId);
        
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
                image: user.sUsuarioImg
            }
        });
    } catch (error) {
        console.error('❌ Error en login:', error);
        
        // Fallback final para HANS
        if (req.body.username?.toUpperCase() === 'HANS' && req.body.password === '12345') {
            console.log('⚠️ Error general, usando fallback final para HANS');
            const token = jwt.sign(
                { id: 5951, username: 'HANS', role: 'ADMIN' },
                process.env.JWT_SECRET || 'clave_secreta_para_jwt',
                { expiresIn: process.env.JWT_EXPIRE || '24h' }
            );
            
            return res.status(200).json({
                success: true,
                message: 'Login exitoso (modo emergencia)',
                token: token,
                user: {
                    id: 5951,
                    username: 'HANS',
                    name: 'Hans Hansen Mojica',
                    role: 'ADMIN'
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
                    createdAt: new Date().toISOString()
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
                createdAt: user.dFechaCreacion
            }
        });
    } catch (error) {
        console.error('Error al obtener perfil:', error);
        next(error);
    }
};