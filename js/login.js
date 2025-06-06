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

const apiBase = 'http://10.11.20.14:5001';
logger.debug('Login.js cargado, API base', { apiBase });

// ===============================
// VARIABLES GLOBALES PARA CAMBIO DE CONTRASEÑA
// ===============================
let tempToken = null;
let currentUser = null;

// ===============================
// FUNCIONES DE UTILIDAD EXISTENTES
// ===============================
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

// ✅ NUEVA FUNCIÓN: Toggle para contraseñas del modal
function togglePasswordModal(inputId, button) {
  const input = document.getElementById(inputId);
  const icon = button.querySelector('.material-icons');
  
  if (input.type === 'password') {
    input.type = 'text';
    icon.textContent = 'visibility_off';
  } else {
    input.type = 'password';
    icon.textContent = 'visibility';
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

// ✅ NUEVAS FUNCIONES PARA PRIMER INGRESO

// Validar fortaleza de contraseña
function validatePasswordStrength(password) {
  const requirements = {
    length: password.length >= 8,
    number: /\d/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
  };
  
  return {
    isValid: requirements.length && requirements.number && requirements.special,
    requirements
  };
}

// Actualizar indicadores visuales de requisitos
function updatePasswordRequirements(password, confirmPassword = '') {
  const validation = validatePasswordStrength(password);
  const requirements = validation.requirements;
  
  // Actualizar indicadores
  updateRequirement('req-length', requirements.length);
  updateRequirement('req-number', requirements.number);
  updateRequirement('req-special', requirements.special);
  updateRequirement('req-match', password === confirmPassword && password.length > 0 && confirmPassword.length > 0);
  
  return validation.isValid && password === confirmPassword && password.length > 0;
}

// Actualizar un requisito específico
function updateRequirement(elementId, isValid) {
  const element = document.getElementById(elementId);
  if (element) {
    const icon = element.querySelector('.material-icons');
    if (isValid) {
      element.classList.add('valid');
      element.classList.remove('invalid');
      icon.textContent = 'check';
    } else {
      element.classList.add('invalid');
      element.classList.remove('valid');
      icon.textContent = 'close';
    }
  }
}

// Mostrar modal de cambio de contraseña
function showChangePasswordModal(token, user) {
  tempToken = token;
  currentUser = user;
  
  const modal = document.getElementById('changePasswordModal');
  if (modal) {
    modal.style.display = 'block';
    
    // Limpiar campos
    document.getElementById('newPassword').value = '';
    document.getElementById('confirmPassword').value = '';
    
    // Ocultar mensajes
    hideModalMessages();
    
    // Resetear requisitos
    updatePasswordRequirements('', '');
    
    // Focus en el primer campo
    setTimeout(() => {
      document.getElementById('newPassword').focus();
    }, 300);
  }
}

// Ocultar modal
function hideChangePasswordModal() {
  const modal = document.getElementById('changePasswordModal');
  if (modal) {
    modal.style.display = 'none';
  }
  
  tempToken = null;
  currentUser = null;
}

// Mostrar/ocultar mensajes del modal
function showModalError(message) {
  const errorDiv = document.getElementById('modalError');
  const successDiv = document.getElementById('modalSuccess');
  
  if (errorDiv) {
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
  }
  
  if (successDiv) {
    successDiv.style.display = 'none';
  }
}

function showModalSuccess(message) {
  const errorDiv = document.getElementById('modalError');
  const successDiv = document.getElementById('modalSuccess');
  
  if (successDiv) {
    successDiv.textContent = message;
    successDiv.style.display = 'block';
  }
  
  if (errorDiv) {
    errorDiv.style.display = 'none';
  }
}

function hideModalMessages() {
  const errorDiv = document.getElementById('modalError');
  const successDiv = document.getElementById('modalSuccess');
  
  if (errorDiv) errorDiv.style.display = 'none';
  if (successDiv) successDiv.style.display = 'none';
}

// Manejar cambio de contraseña
async function handleChangePassword(e) {
  e.preventDefault();
  
  const newPassword = document.getElementById('newPassword').value;
  const confirmPassword = document.getElementById('confirmPassword').value;
  const submitBtn = document.getElementById('changePasswordBtn');
  
  hideModalMessages();
  
  // Validaciones básicas
  if (!newPassword || !confirmPassword) {
    showModalError('Todos los campos son requeridos');
    return;
  }
  
  if (newPassword !== confirmPassword) {
    showModalError('Las contraseñas no coinciden');
    return;
  }
  
  const validation = validatePasswordStrength(newPassword);
  if (!validation.isValid) {
    showModalError('La contraseña no cumple con los requisitos de seguridad');
    return;
  }
  
  // Deshabilitar botón y mostrar carga
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<div class="spinner"></div> Cambiando contraseña...';
  }
  
  try {
    logger.debug('Enviando solicitud de cambio de contraseña');
    
    const response = await fetch(`${apiBase}/api/auth/change-first-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tempToken}`
      },
      body: JSON.stringify({
        newPassword,
        confirmPassword
      })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Error al cambiar contraseña');
    }
    
    if (!data.success) {
      throw new Error(data.message || 'Error al cambiar contraseña');
    }
    
    logger.info('Contraseña cambiada exitosamente');
    showModalSuccess('Contraseña cambiada exitosamente. Será redirigido al login...');
    
    // Esperar 2 segundos y redirigir al login
    setTimeout(() => {
      hideChangePasswordModal();
      // Limpiar campos del login
      document.getElementById('username').value = '';
      document.getElementById('password').value = '';
      
      // Mostrar mensaje de éxito en el login
      const loginError = document.getElementById('loginError');
      if (loginError) {
        loginError.style.display = 'block';
        loginError.style.backgroundColor = '#f0fdf4';
        loginError.style.color = '#16a34a';
        loginError.style.borderColor = '#bbf7d0';
        loginError.textContent = 'Contraseña cambiada exitosamente. Inicie sesión con su nueva contraseña.';
      }
    }, 2000);
    
  } catch (error) {
    logger.error('Error al cambiar contraseña', error);
    showModalError(error.message || 'Error al cambiar contraseña');
  } finally {
    // Restaurar botón
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<span class="material-icons">check</span> Cambiar Contraseña';
    }
  }
}

// FUNCIONES EXISTENTES (sin cambios)
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

async function handleChangePasswordOld(e) {
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
// MANEJO DE LOGIN ACTUALIZADO
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
        // Resetear estilos
        errorDiv.style.backgroundColor = '';
        errorDiv.style.color = '';
        errorDiv.style.borderColor = '';
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

        // ✅ NUEVO: Verificar si requiere cambio de contraseña
        if (data.requirePasswordChange) {
          logger.info('Primer ingreso detectado - Requiere cambio de contraseña');
          showChangePasswordModal(data.tempToken, data.user);
          return;
        }

        // ✅ LOGIN NORMAL - Usuario ya cambió contraseña
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
          idCliente: data.user.idCliente,  // ✅ NUEVO: Incluir idCliente
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

  // ✅ NUEVO: Eventos para el formulario de cambio de contraseña
  const changePasswordForm = document.getElementById('changePasswordForm');
  if (changePasswordForm) {
    changePasswordForm.addEventListener('submit', handleChangePassword);
    logger.debug('Event listener para cambio de contraseña agregado');
  }

  // ✅ NUEVO: Eventos para validación en tiempo real
  const newPasswordInput = document.getElementById('newPassword');
  const confirmPasswordInput = document.getElementById('confirmPassword');
  const changePasswordBtn = document.getElementById('changePasswordBtn');

  if (newPasswordInput && confirmPasswordInput && changePasswordBtn) {
    function validateAndUpdate() {
      const newPassword = newPasswordInput.value;
      const confirmPassword = confirmPasswordInput.value;
      const isValid = updatePasswordRequirements(newPassword, confirmPassword);
      
      changePasswordBtn.disabled = !isValid;
    }

    newPasswordInput.addEventListener('input', validateAndUpdate);
    confirmPasswordInput.addEventListener('input', validateAndUpdate);
    
    logger.debug('Event listeners para validación de contraseña agregados');
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

  // Añadir evento al formulario de cambio de contraseña si existe (función antigua)
  const changePasswordFormOld = document.getElementById('changePasswordFormOld');
  if (changePasswordFormOld) {
    changePasswordFormOld.addEventListener('submit', handleChangePasswordOld);
    logger.debug('Event listener para cambio de contraseña (viejo) agregado');
  }

  // ✅ NUEVO: Cerrar modal al hacer click fuera de él (opcional)
  const modal = document.getElementById('changePasswordModal');
  if (modal) {
    modal.addEventListener('click', function(e) {
      if (e.target === modal) {
        // No permitir cerrar el modal clickeando fuera
        // hideChangePasswordModal(); 
      }
    });
  }
});