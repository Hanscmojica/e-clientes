// controllers/authController.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../utils/prisma');

exports.login = async (req, res, next) => {
    try {
        console.log('Login request received:', req.body);
        const { username, password } = req.body;
        
        // Forzar modo desarrollo para pruebas
        // Para este usuario específico, permitir acceso directo
        if (username === 'HANS' && password === '12345') {
            console.log('Modo de prueba para HANS activado - Acceso directo!');
            return res.status(200).json({
                success: true,
                message: 'Login exitoso en modo prueba',
                token: jwt.sign(
                    { id: 5, username: 'HANS', role: 'ADMIN' },
                    process.env.JWT_SECRET || 'clave_secreta_para_jwt',
                    { expiresIn: '24h' }
                ),
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
                return res.status(200).json({
                    success: true,
                    message: 'Login exitoso',
                    token: jwt.sign(
                        { id: 0, username: 'usuario', role: 'USER' },
                        process.env.JWT_SECRET || 'clave_secreta_para_jwt',
                        { expiresIn: '24h' }
                    ),
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
            return res.status(401).json({
                success: false,
                message: 'Credenciales incorrectas - Usuario no encontrado'
            });
        }
        
        // Verificar contraseña
        const passwordValid = await bcrypt.compare(password, user.sPassword);
        console.log('Verificación de contraseña:', passwordValid ? 'Correcta' : 'Incorrecta');
        
        if (!passwordValid) {
            return res.status(401).json({
                success: false,
                message: 'Credenciales incorrectas - Contraseña inválida'
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
        next(error);
    }
};

exports.logout = (req, res) => {
    // En un sistema real, podríamos incluir el token en una lista negra
    res.status(200).json({
        success: true,
        message: 'Sesión cerrada correctamente'
    });
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