// ===============================
// SISTEMA DE LOGGING SEGURO (COMPARTIDO)
// ===============================
class SecureLogger {
  constructor() {
    this.isDevelopment = this.detectEnvironment();
    this.levels = { ERROR: 0, WARN: 1, INFO: 2, DEBUG: 3 };
    this.currentLevel = this.isDevelopment ? this.levels.DEBUG : this.levels.ERROR;
  }
  
  detectEnvironment() {
    return (
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1' ||
      window.location.hostname.includes('dev') ||
      window.location.hostname.includes('test') ||
      window.location.port !== '' ||
      window.location.protocol === 'file:'
    );
  }
  
  error(message, data = null) {
    if (this.currentLevel >= this.levels.ERROR) {
      console.error(`🚨 [ERROR] ${message}`, data || '');
    }
  }
  
  warn(message, data = null) {
    if (this.currentLevel >= this.levels.WARN) {
      console.warn(`⚠️ [WARN] ${message}`, data || '');
    }
  }
  
  info(message, data = null) {
    if (this.currentLevel >= this.levels.INFO) {
      console.log(`ℹ️ [INFO] ${message}`, data || '');
    }
  }
  
  debug(message, data = null) {
    if (this.currentLevel >= this.levels.DEBUG) {
      console.log(`🐛 [DEBUG] ${message}`, data || '');
    }
  }
  
  auth(message, data = null) {
    if (this.isDevelopment) {
      const safePrint = this.sanitizeAuthData(data);
      console.log(`🔐 [AUTH] ${message}`, safePrint);
    }
  }
  
  sanitizeAuthData(data) {
    if (!data || typeof data !== 'object') return data;
    const safe = { ...data };
    const sensitiveFields = ['token', 'password', 'email', 'jwt'];
    sensitiveFields.forEach(field => {
      if (safe[field]) {
        safe[field] = '***HIDDEN***';
      }
    });
    return safe;
  }
  
  setProductionMode() {
    this.currentLevel = this.levels.ERROR;
    this.isDevelopment = false;
    console.warn('🚨 Logger configurado para PRODUCCIÓN - Solo errores se mostrarán');
  }
}

// Crear instancia global del logger
const logger = new SecureLogger();

// ⚠️ PARA PRODUCCIÓN: Descomentar la siguiente línea
logger.setProductionMode();

const apiBase = 'http://10.11.21.15:5001';
logger.debug('Login.js cargado, API base', { apiBase });

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

function logout() {
  localStorage.removeItem('userSession');
  localStorage.removeItem('token');
  sessionStorage.removeItem('userSession');
  window.location.href = 'login.html';
}

// Hacer la función logout disponible globalmente
window.logout = logout;

function showPasswordExpiredModal() {
  const modal = document.getElementById('passwordExpiredModal');
  if (modal) {
    modal.style.display = 'block';
  }
}

function closeModal() {
  const modal = document.getElementById('passwordExpiredModal');
  if (modal) {
    modal.style.display = 'none';
  }
}

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
    logger.error('Error cambiando contraseña', error);
    if (errorDiv) {
      errorDiv.textContent = error.message;
      errorDiv.style.display = 'block';
    }
  }
}

// ===============================
// MANEJO DE LOGIN
// ===============================
document.addEventListener('DOMContentLoaded', function() {
  const loginForm = document.getElementById('loginForm');
  
  if (loginForm) {
    logger.debug('Formulario de login encontrado');
    
    loginForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      const username = document.getElementById('username').value;
      const password = document.getElementById('password').value;
      const rememberMe = document.getElementById('rememberMe')?.checked || false;
      const errorDiv = document.getElementById('loginError');
      const loginButton = document.querySelector('.login-button');
      
      logger.debug('Iniciando proceso de login', { username, rememberMe });
      
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
        logger.debug('Enviando petición de login');
        
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

        logger.debug('Status de respuesta recibido', { status: response.status });
        
        let data;
        try {
          data = await response.json();
          logger.debug('Datos recibidos del servidor');
        } catch (parseError) {
          logger.error('Error al parsear JSON', parseError);
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

        logger.info('Login exitoso');
        logger.auth('Token recibido', { token: data.token });
        logger.auth('Usuario autenticado', data.user);
        
        // GUARDAR TOKEN Y SESIÓN
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
          logger.debug('Sesión guardada en localStorage (persistente)');
        } else {
          sessionStorage.setItem('userSession', JSON.stringify(sessionData));
          logger.debug('Sesión guardada en sessionStorage (temporal)');
        }
        
        logger.debug('Token guardado en localStorage');
        logger.auth('Sesión guardada', sessionData);
        
        // Verificar que se guardó correctamente
        const tokenGuardado = localStorage.getItem('token');
        const sessionGuardadaLocal = localStorage.getItem('userSession');
        const sessionGuardadaSession = sessionStorage.getItem('userSession');
        
        logger.debug('Verificación de guardado', {
          token: tokenGuardado ? 'SÍ' : 'NO',
          localStorage: sessionGuardadaLocal ? 'SÍ' : 'NO',
          sessionStorage: sessionGuardadaSession ? 'SÍ' : 'NO'
        });
        
        if (!tokenGuardado || (!sessionGuardadaLocal && !sessionGuardadaSession)) {
          throw new Error('Error al guardar la sesión localmente');
        }
        
        logger.info('Todo guardado correctamente, redirigiendo...');
        
        // Redirigir a la página de referencias
        window.location.href = 'api.html';

      } catch (error) {
        logger.error('Error en login', error);
        
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
    logger.warn('Formulario de login no encontrado');
  }

  // Verificar si ya hay una sesión activa al cargar la página
  if (window.location.pathname.endsWith('login.html') || window.location.pathname === '/') {
    const token = localStorage.getItem('token');
    const userSession = localStorage.getItem('userSession') || sessionStorage.getItem('userSession');
    
    logger.debug('Verificando sesión existente', {
      token: token ? 'SÍ' : 'NO',
      session: userSession ? 'SÍ' : 'NO'
    });
    
    if (token && userSession) {
      logger.info('Sesión existente encontrada, redirigiendo...');
      // Prevenir parpadeo durante la redirección
      document.body.style.display = 'none';
      window.location.replace('api.html');
    }
  }

  // Añadir evento al formulario de cambio de contraseña si existe
  const changePasswordForm = document.getElementById('changePasswordForm');
  if (changePasswordForm) {
    changePasswordForm.addEventListener('submit', handleChangePassword);
    logger.debug('Event listener para cambio de contraseña agregado');
  }
});