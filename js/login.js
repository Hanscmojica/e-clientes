// Construye la URL base dinámicamente
const apiBase = `${window.location.protocol}//${window.location.host}`;

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
    // Llamar a la API real de autenticación
    const response = await loginUser(username, password);
    
    if (response.success) {
      // Guardar información de sesión
      const sessionData = {
        username: response.user.username,
        token: response.token,
        role: response.user.role,
        name: response.user.name,
        id: response.user.id,
        loginTime: new Date().toISOString()
      };
      
      console.log('Datos de sesión a guardar:', sessionData);
      
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

// Función real para autenticación con el backend
async function loginUser(username, password) {
  try {
    console.log('Enviando petición de login con:', { username, password });
    
    // Usa la URL dinámica
    const response = await fetch(`${apiBase}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, password })
    });
    
    // Convertir la respuesta a JSON
    const data = await response.json();
    console.log('Respuesta del servidor:', data);
    
    // Si la respuesta no es exitosa, lanzar error
    if (!response.ok) {
      throw new Error(data.message || 'Error al iniciar sesión');
    }
    
    // Devolver los datos de la respuesta
    return data;
  } catch (error) {
    console.error('Error en loginUser:', error);
    throw error;
  }
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