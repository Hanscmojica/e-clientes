// Construye la URL base dinámicamente
const apiBase = `${window.location.protocol}//${window.location.host}`;

// Función para mostrar/ocultar contraseña (compatibilidad login y modal)
function togglePassword(inputId, btn) {
  // Si no se pasan argumentos, es el botón del login principal
  if (!inputId || !btn) {
    const passwordInput = document.getElementById('password');
    const toggleBtn = document.querySelector('.toggle-password .material-icons');
    if (passwordInput.type === 'password') {
      passwordInput.type = 'text';
      toggleBtn.textContent = 'visibility_off';
    } else {
      passwordInput.type = 'password';
      toggleBtn.textContent = 'visibility';
    }
    return;
  }
  // Si se pasan argumentos, es para los toggles del modal
  const passwordInput = document.getElementById(inputId);
  const toggleBtn = btn.querySelector('.material-icons');
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
      // Si el mensaje es de contraseña expirada/caducada, muestra el modal
      if (response.message && /(caducad|expirad|expired)/i.test(response.message)) {
        showPasswordExpiredModal();
        throw new Error(response.message);
      }
      throw new Error(response.message || 'Credenciales inválidas');
    }
    
  } catch (error) {
    // Si el error es de contraseña expirada/caducada, muestra el modal (por si acaso)
    if (error.message && /(caducad|expirad|expired)/i.test(error.message)) {
      showPasswordExpiredModal();
    }
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

// Mostrar el modal si la contraseña ha expirado
function showPasswordExpiredModal() {
  const modal = document.getElementById('passwordExpiredModal');
  modal.style.display = 'block';
}

// Cerrar el modal
function closeModal() {
  const modal = document.getElementById('passwordExpiredModal');
  modal.style.display = 'none';
}

// Manejar el envío del formulario de cambio de contraseña
async function handleChangePassword(e) {
  e.preventDefault();
  const newPassword = document.getElementById('newPassword').value;
  const confirmPassword = document.getElementById('confirmPassword').value;
  const errorDiv = document.getElementById('loginError');

  if (newPassword !== confirmPassword) {
    errorDiv.textContent = 'Las contraseñas no coinciden';
    errorDiv.style.display = 'block';
    return;
  }

  try {
    const response = await fetch(`${apiBase}/api/auth/change-password-expired`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ newPassword })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Error al cambiar la contraseña');
    }

    alert('Contraseña cambiada exitosamente');
    closeModal();
  } catch (error) {
    errorDiv.textContent = error.message;
    errorDiv.style.display = 'block';
  }
}

// Añadir evento al formulario de cambio de contraseña
document.getElementById('changePasswordForm')?.addEventListener('submit', handleChangePassword);