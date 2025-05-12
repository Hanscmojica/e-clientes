// Archivo para manejar la autenticación en todas las páginas

// Función para verificar si el usuario está autenticado
/*function checkAuth() { 
    const userSession = localStorage.getItem('userSession') || sessionStorage.getItem('userSession');
    
    if (!userSession) {
      // Si no hay sesión, redirigir al login
      window.location.href = 'login.html';
      return false;
    }
    
    try {
      const sessionData = JSON.parse(userSession);
      
      // Verificar si la sesión no ha expirado (ejemplo: 24 horas)
      const loginTime = new Date(sessionData.loginTime);
      const now = new Date();
      const hoursDiff = (now - loginTime) / (1000 * 60 * 60);
      
      if (hoursDiff > 24) {
        // Sesión expirada
        logout();
        return false;
      }
      
      return sessionData;
    } catch (error) {
      // Error al parsear la sesión
      logout();
      return false;
    }
  }
  
  // Función para cerrar sesión
  function logout() {
    // Limpiar toda la información de sesión
    localStorage.removeItem('userSession');
    sessionStorage.removeItem('userSession');
    
    // Redirigir al login
    window.location.href = 'login.html';
  }
  
  // Función para obtener información del usuario actual
  function getCurrentUser() {
    const userSession = localStorage.getItem('userSession') || sessionStorage.getItem('userSession');
    
    if (userSession) {
      try {
        return JSON.parse(userSession);
      } catch (error) {
        return null;
      }
    }
    
    return null;
  }
  
  // Función para actualizar el header con información del usuario
  function updateUserInterface() {
    const user = getCurrentUser();
    
    if (user) {
      // Actualizar el nombre de usuario en el header
      const userNameElement = document.querySelector('.user-name');
      if (userNameElement) {
        userNameElement.textContent = user.username;
      }
    }
  }
  
  // Función para hacer peticiones autenticadas
  async function authenticatedRequest(url, options = {}) {
    const user = getCurrentUser();
    
    if (!user || !user.token) {
      throw new Error('No hay sesión activa');
    }
    
    // Agregar el token a las cabeceras
    const headers = {
      ...options.headers,
      'Authorization': `Bearer ${user.token}`
    };
    
    return axios({
      ...options,
      url,
      headers
    });
  }
  
  // Exportar funciones para uso global
  window.auth = {
    checkAuth,
    logout,
    getCurrentUser,
    updateUserInterface,
    authenticatedRequest
  };*/

  // Archivo auth.js simplificado sin autenticación real
/*window.auth = {
  checkAuth: function() {
    return { username: 'Usuario' }; // Simula un usuario autenticado
  },
  logout: function() {
    console.log('Logout simulado');
  },
  updateUserInterface: function() {
    const userNameElement = document.querySelector('.user-name');
    if (userNameElement) {
      userNameElement.textContent = 'Usuario';
    }
  },
  authenticatedRequest: async function(url, options = {}) {
    // Simplemente hace la petición sin token de autenticación
    return axios({
      ...options,
      url
    });
  }
};*/