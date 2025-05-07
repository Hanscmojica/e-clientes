// services/authService.js
// Servicio de autenticación simplificado (sin dependencia de modelo User)

exports.authenticate = async (username, password) => {
  // Autenticación simple para desarrollo
  if (username === 'usuario' && password === 'password123') {
    return {
      success: true,
      user: {
        username: 'usuario',
        name: 'Usuario de Prueba',
        role: 'user'
      }
    };
  } else {
    return {
      success: false,
      message: 'Credenciales incorrectas'
    };
  }
};