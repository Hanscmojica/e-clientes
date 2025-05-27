// Configuración de la URL base de la API
const apiBase = `${window.location.protocol}//${window.location.hostname}:5001`;

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
  localStorage.removeItem('token');
  sessionStorage.removeItem('userSession');
  
  // Redirigir a la página de login
  window.location.href = 'login.html';
}

// Hacer la función logout disponible globalmente
window.logout = logout;
  
// Manejar el envío del formulario de login - ARREGLADO
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
        console.log('🔍 Intentando login con:', username);
        
        const response = await fetch(`${apiBase}/api/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        console.log('🔍 Respuesta del servidor - Status:', response.status);
        
        const data = await response.json();
        console.log('🔍 Datos recibidos del servidor:', data);

        if (!response.ok) {
            throw new Error(data.message || 'Error al iniciar sesión');
        }

        if (!data.success) {
            throw new Error(data.message || 'Login falló');
        }

        if (!data.token) {
            throw new Error('No se recibió token del servidor');
        }

        console.log('✅ Login exitoso!');
        console.log('✅ Token recibido:', data.token);
        console.log('✅ Usuario:', data.user);
        
        // GUARDAR TOKEN Y SESIÓN - AQUÍ ESTABA EL PROBLEMA
        localStorage.setItem('token', data.token);
        
        const sessionData = {
            id: data.user.id,
            username: data.user.username,
            name: data.user.name,
            role: data.user.role,
            token: data.token,
            loginTime: new Date().toISOString()
        };
        
        localStorage.setItem('userSession', JSON.stringify(sessionData));
        
        console.log('✅ Token guardado en localStorage');
        console.log('✅ Sesión guardada:', sessionData);
        
        // Verificar que se guardó correctamente
        const tokenGuardado = localStorage.getItem('token');
        const sessionGuardada = localStorage.getItem('userSession');
        
        console.log('🔍 Verificación - Token guardado:', tokenGuardado ? 'SÍ' : 'NO');
        console.log('🔍 Verificación - Sesión guardada:', sessionGuardada ? 'SÍ' : 'NO');
        
        if (!tokenGuardado || !sessionGuardada) {
            throw new Error('Error al guardar la sesión localmente');
        }
        
        console.log('✅ Todo guardado correctamente, redirigiendo...');
        
        // Redirigir a la página de referencias (no perfil)
        window.location.href = 'api.html';

    } catch (error) {
        console.error('❌ Error en login:', error);
        errorDiv.textContent = error.message;
        errorDiv.style.display = 'block';
        
        // Limpiar cualquier dato parcial
        localStorage.removeItem('token');
        localStorage.removeItem('userSession');
        
    } finally {
        // Restaurar botón
        loginButton.disabled = false;
        loginButton.innerHTML = '<span class="material-icons">login</span> Iniciar Sesión';
    }
});

// Verificar si ya hay una sesión activa al cargar la página
document.addEventListener('DOMContentLoaded', function() {
  // Solo ejecutar esta lógica si estamos en la página de login
  if (window.location.pathname.endsWith('login.html') || window.location.pathname === '/') {
    const token = localStorage.getItem('token');
    const userSession = localStorage.getItem('userSession');
    
    console.log('🔍 Verificando sesión existente...');
    console.log('Token encontrado:', token ? 'SÍ' : 'NO');
    console.log('Sesión encontrada:', userSession ? 'SÍ' : 'NO');
    
    if (token && userSession) {
      console.log('✅ Sesión existente encontrada, redirigiendo...');
      // Prevenir parpadeo durante la redirección
      document.body.style.display = 'none';
      window.location.replace('api.html');
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