// controllers/authController.js
const authService = require('../services/authService');

exports.login = async (req, res, next) => {
    try {
        const { username, password } = req.body;
        
        // Para modo de prueba, usar usuario y contraseña fijos
        if (process.env.NODE_ENV === 'development') {
            if (username === 'usuario' && password === 'password123') {
                return res.status(200).json({
                    success: true,
                    message: 'Login exitoso',
                    user: {
                        username: 'usuario',
                        name: 'Usuario de Prueba',
                        role: 'user'
                    }
                });
            } else {
                return res.status(401).json({
                    success: false,
                    message: 'Credenciales incorrectas'
                });
            }
        }
        
        // En producción, usar el servicio de autenticación
        const result = await authService.authenticate(username, password);
        
        if (result.success) {
            return res.status(200).json({
                success: true,
                message: 'Login exitoso',
                token: result.token,
                user: result.user
            });
        } else {
            return res.status(401).json({
                success: false,
                message: result.message || 'Credenciales incorrectas'
            });
        }
    } catch (error) {
        next(error);
    }
};

exports.logout = (req, res) => {
    // En un sistema real, invalidaríamos el token
    res.status(200).json({
        success: true,
        message: 'Sesión cerrada correctamente'
    });
};