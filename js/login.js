// Función para mostrar/ocultar contraseña
function togglePassword() {
    const passwordInput = document.getElementById('password');
    const toggleBtn = document.querySelector('.toggle-password .material-icons');
    
    if (passwordInput.type === 'password') {
      passwordInput.type = 'text';
      toggleBtn.textContent = 'visibility_off';
    } else {
      passwordInput.type = 'password';
      toggleBtn.textContent = 'visibility';
    }
  }

// Función global para cerrar sesión - disponible para todas las páginas
function logout() {
  // Eliminar datos de sesión tanto de localStorage como de sessionStorage
  localStorage.removeItem('userSession');
  sessionStorage.removeItem('userSession');
  
  // Redirigir a la página de login
  window.location.href = 'login.html';
}

// Hacer la función logout disponible globalmente
window.logout = logout;
  
// Manejar el envío del formulario
document.getElementById('loginForm')?.addEventListener('submit', async function(e) {
  e.preventDefault();
  
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  const rememberMe = document.getElementById('rememberMe').checked;
  const errorDiv = document.getElementById('loginError');
  const loginButton = document.querySelector('.login-button');
  
  // Limpiar errores previos
  errorDiv.style.display = 'none';
  errorDiv.textContent = '';
  
  // Deshabilitar el botón durante el proceso
  loginButton.disabled = true;
  loginButton.innerHTML = '<span class="material-icons">hourglass_empty</span> Iniciando sesión...';
  
  try {
    // Aquí deberías hacer la llamada a tu API de autenticación
    // Por ahora simularemos una autenticación básica
    
    // Simulación de llamada a API (reemplazar con tu endpoint real)
    const response = await simulateLogin(username, password);
    
    if (response.success) {
      // Guardar información de sesión
      const sessionData = {
        username: response.username,
        token: response.token,
        loginTime: new Date().toISOString()
      };
      
      // Guardar en localStorage o sessionStorage según "Recordarme"
      if (rememberMe) {
        localStorage.setItem('userSession', JSON.stringify(sessionData));
      } else {
        sessionStorage.setItem('userSession', JSON.stringify(sessionData));
      }
      
      // Redirigir a la página principal (api.html)
      window.location.href = 'api.html';
    } else {
      throw new Error(response.message || 'Credenciales inválidas');
    }
    
  } catch (error) {
    // Mostrar error
    errorDiv.textContent = error.message;
    errorDiv.style.display = 'block';
    
    // Restaurar el botón
    loginButton.disabled = false;
    loginButton.innerHTML = '<span class="material-icons">login</span> Iniciar Sesión';
  }
});

// Función simulada de login (reemplazar con llamada real a tu API)
async function simulateLogin(username, password) {
  // Simular delay de red
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Validación simple (reemplazar con tu lógica real)
  if (username === 'admin' && password === 'admin123') {
    return {
      success: true,
      username: username,
      token: 'fake-jwt-token-' + Date.now()
    };
  } else {
    return {
      success: false,
      message: 'Usuario o contraseña incorrectos'
    };
  }
  
  /* Ejemplo de cómo sería la llamada real a tu API:
  
  try {
    const response = await axios.post('http://localhost:5001/api/v1/login', {
      username: username,
      password: password
    });
    
    return {
      success: true,
      username: response.data.username,
      token: response.data.token
    };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || 'Error al iniciar sesión'
    };
  }
  */
}

// Verificar si ya hay una sesión activa al cargar la página
document.addEventListener('DOMContentLoaded', function() {
  // Solo ejecutar esta lógica si estamos en la página de login
  if (window.location.pathname.includes('login.html')) {
    const userSession = localStorage.getItem('userSession') || sessionStorage.getItem('userSession');
    
    if (userSession) {
      // Si ya hay sesión, redirigir a api.html
      window.location.href = 'api.html';
    }
  }
});