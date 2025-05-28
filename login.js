// Configuración de la URL base de la API
const apiBase = 'http://localhost:5001';

console.log('🔧 Login.js cargado, API base:', apiBase);

// Función para mostrar/ocultar contraseña (compatibilidad login y modal)
function togglePassword(inputId, btn) {
  // Si no se pasan argumentos, es el botón del login principal
  if (!inputId || !btn) {
    const passwordInput = document.getElementById('password');
    const toggleBtn = document.querySelector('.toggle-password .material-icons');
    if (passwordInput && toggleBtn) {
      if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        toggleBtn.textContent = 'visibility_off';
      } else {
        passwordInput.type = 'password';
        toggleBtn.textContent = 'visibility';
      }
    }
    return;
  }
  // Si se pasan argumentos, es para los toggles del modal
  const passwordInput = document.getElementById(inputId);
  const toggleBtn = btn.querySelector('.material-icons');
  if (passwordInput && toggleBtn) {
    if (passwordInput.type === 'password') {
      passwordInput.type = 'text';
      toggleBtn.textContent = 'visibility_off';
    } else {
      passwordInput.type = 'password';
      toggleBtn.textContent = 'visibility';
    }
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

// Mostrar el modal si la contraseña ha expirado
function showPasswordExpiredModal() {
  const modal = document.getElementById('passwordExpiredModal');
  if (modal) {
    modal.style.display = 'block';
  }
}

// Cerrar el modal
function closeModal() {
  const modal = document.getElementById('passwordExpiredModal');
  if (modal) {
    modal.style.display = 'none';
  }
}

// Manejar el envío del formulario de cambio de contraseña
async function handleChangePassword(e) {
  e.preventDefault();
  const newPassword = document.getElementById('newPassword').value;
  const confirmPassword = document.getElementById('confirmPassword').value;
  const errorDiv = document.getElementById('loginError');

  if (newPassword !== confirmPassword) {
    if (errorDiv) {
      errorDiv.textContent = 'Las contraseñas no coinciden';
      errorDiv.style.display = 'block';
    }
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
    if (errorDiv) {
      errorDiv.textContent = error.message;
      errorDiv.style.display = 'block';
    }
  }
}
  
// Manejar el envío del formulario de login - VERSIÓN COMPLETA RESTAURADA
document.addEventListener('DOMContentLoaded', function() {
  const loginForm = document.getElementById('loginForm');
  
  if (loginForm) {
    console.log('✅ Formulario de login encontrado');
    
    loginForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      const username = document.getElementById('username').value;
      const password = document.getElementById('password').value;
      const rememberMe = document.getElementById('rememberMe')?.checked || false;
      const errorDiv = document.getElementById('loginError');
      const loginButton = document.querySelector('.login-button');
      
      console.log('🔍 Iniciando proceso de login para:', username);
      console.log('🔍 Recordar sesión:', rememberMe);
      
      // Limpiar errores previos
      if (errorDiv) {
        errorDiv.style.display = 'none';
        errorDiv.textContent = '';
      }
      
      // Deshabilitar el botón durante el proceso
      if (loginButton) {
        loginButton.disabled = true;
        loginButton.innerHTML = '<span class="material-icons">hourglass_empty</span> Iniciando sesión...';
      }
      
      try {
        console.log('🔍 Enviando petición a:', `${apiBase}/api/auth/login`);
        
        const response = await fetch(`${apiBase}/api/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({ 
            username: username.trim(), 
            password: password 
          })
        });

        console.log('🔍 Status de respuesta:', response.status);
        
        let data;
        try {
          data = await response.json();
          console.log('🔍 Datos recibidos del servidor:', data);
        } catch (parseError) {
          console.error('❌ Error al parsear JSON:', parseError);
          throw new Error('Respuesta inválida del servidor');
        }

        if (!response.ok) {
          throw new Error(data.message || `Error del servidor: ${response.status}`);
        }

        if (!data.success) {
          throw new Error(data.message || 'Login falló');
        }

        if (!data.token || !data.user) {
          throw new Error('No se recibió token del servidor');
        }

        console.log('✅ Login exitoso!');
        console.log('✅ Token recibido:', data.token);
        console.log('✅ Usuario:', data.user);
        
        // GUARDAR TOKEN Y SESIÓN - LÓGICA COMPLETA RESTAURADA
        localStorage.setItem('token', data.token);
        
        const sessionData = {
          id: data.user.id,
          username: data.user.username,
          name: data.user.name,
          role: data.user.role,
          email: data.user.email,
          token: data.token,
          loginTime: new Date().toISOString()
        };
        
        // Decidir dónde guardar basado en "recordar sesión"
        if (rememberMe) {
          localStorage.setItem('userSession', JSON.stringify(sessionData));
          console.log('✅ Sesión guardada en localStorage (persistente)');
        } else {
          sessionStorage.setItem('userSession', JSON.stringify(sessionData));
          console.log('✅ Sesión guardada en sessionStorage (temporal)');
        }
        
        console.log('✅ Token guardado en localStorage');
        console.log('✅ Sesión guardada:', sessionData);
        
        // Verificar que se guardó correctamente
        const tokenGuardado = localStorage.getItem('token');
        const sessionGuardadaLocal = localStorage.getItem('userSession');
        const sessionGuardadaSession = sessionStorage.getItem('userSession');
        
        console.log('🔍 Verificación - Token guardado:', tokenGuardado ? 'SÍ' : 'NO');
        console.log('🔍 Verificación - Sesión localStorage:', sessionGuardadaLocal ? 'SÍ' : 'NO');
        console.log('🔍 Verificación - Sesión sessionStorage:', sessionGuardadaSession ? 'SÍ' : 'NO');
        
        if (!tokenGuardado || (!sessionGuardadaLocal && !sessionGuardadaSession)) {
          throw new Error('Error al guardar la sesión localmente');
        }
        
        console.log('✅ Todo guardado correctamente, redirigiendo...');
        
        // Redirigir a la página de referencias
        window.location.href = 'api.html';

      } catch (error) {
        console.error('❌ Error en login:', error);
        
        if (errorDiv) {
          errorDiv.textContent = error.message || 'Error desconocido';
          errorDiv.style.display = 'block';
        }
        
        // Limpiar cualquier dato parcial
        localStorage.removeItem('token');
        localStorage.removeItem('userSession');
        sessionStorage.removeItem('userSession');
        
      } finally {
        // Restaurar botón
        if (loginButton) {
          loginButton.disabled = false;
          loginButton.innerHTML = '<span class="material-icons">login</span> Iniciar Sesión';
        }
      }
    });
  } else {
    console.warn('⚠️ Formulario de login no encontrado');
  }

  // Verificar si ya hay una sesión activa al cargar la página
  // Solo ejecutar esta lógica si estamos en la página de login
  if (window.location.pathname.endsWith('login.html') || window.location.pathname === '/') {
    const token = localStorage.getItem('token');
    const userSession = localStorage.getItem('userSession') || sessionStorage.getItem('userSession');
    
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

  // Añadir evento al formulario de cambio de contraseña si existe
  const changePasswordForm = document.getElementById('changePasswordForm');
  if (changePasswordForm) {
    changePasswordForm.addEventListener('submit', handleChangePassword);
    console.log('✅ Event listener para cambio de contraseña agregado');
  }
});