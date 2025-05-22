// Construye la URL base dinámicamente
const apiBase = `${window.location.protocol}//${window.location.host}`;

// Ejemplo de login
async function login(username, password) {
  try {
    const response = await fetch(`${apiBase}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error en login:', error);
    throw error;
  }
}

// Ejemplo de obtener datos del perfil
async function getProfile() {
  try {
    const response = await fetch(`${apiBase}/api/profile`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error al obtener perfil:', error);
    throw error;
  }
}

// Datos del usuario (simulado - en producción vendría del backend)
let userData = {
    nombre: "Hans Carli Rowesonur",
    apellidos: "Hansen Mojica",
    email: "hansc.mojica@rodall.com",
    telefono: "+52 961 573 5235",
    direccion: "Av. Principal #123, Veracruz, Ver.",
    empresa: {
      nombre: "Toyar Trade S.A. de C.V.",
      rfc: "IAB123456HM7",
      cargo: "Administrador",
      direccion: "Av. Francisco I. Madero 33, Centro, 91700 Veracruz."
    },
    preferencias: {
      idioma: "es",
      formatoFecha: "dd/mm/yyyy",
      tema: "light",
      itemsPorPagina: "10"
    },
    notificaciones: {
      emailNuevasReferencias: true,
      emailActualizaciones: true,
      emailReportes: false,
      sistemaAlertas: true,
      sistemaMantenimiento: true
    }
  };
  
  // Inicialización
  document.addEventListener('DOMContentLoaded', function() {
    // Verificar si hay sesión activa
    verificarSesion();
    
    // Configurar botón de cambio de tema
    const themeToggle = document.getElementById('theme-toggle');
    const themeIcon = document.getElementById('theme-icon');
    
    // Verificar si hay un tema guardado
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      document.body.classList.add('dark-theme');
      themeIcon.textContent = 'dark_mode';
    }
    
    // Manejar clic en botón de tema
    if (themeToggle) {
      themeToggle.addEventListener('click', function() {
        // Añadir clase para animación
        themeToggle.classList.add('rotate');
        
        // Cambiar tema
        if (document.body.classList.contains('dark-theme')) {
          document.body.classList.remove('dark-theme');
          themeIcon.textContent = 'light_mode';
          localStorage.setItem('theme', 'light');
          
          // Actualizar select de tema si existe
          const temaSelect = document.getElementById('tema');
          if (temaSelect) temaSelect.value = 'light';
        } else {
          document.body.classList.add('dark-theme');
          themeIcon.textContent = 'dark_mode';
          localStorage.setItem('theme', 'dark');
          
          // Actualizar select de tema si existe
          const temaSelect = document.getElementById('tema');
          if (temaSelect) temaSelect.value = 'dark';
        }
        
        // Quitar clase de animación después de completarse
        setTimeout(() => {
          themeToggle.classList.remove('rotate');
        }, 500);
      });
    }
    
    // Configurar navegación lateral
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const section = item.dataset.section;
        cambiarSeccion(section);
      });
    });
  
    // Configurar toggle de 2FA
    const toggle2FA = document.getElementById('toggle-2fa');
    const status2FA = document.getElementById('2fa-status');
    
    toggle2FA.addEventListener('change', function() {
      if (this.checked) {
        status2FA.textContent = 'Activado';
        mostrarAlerta('Autenticación de dos factores activada', 'success');
      } else {
        status2FA.textContent = 'Desactivado';
        mostrarAlerta('Autenticación de dos factores desactivada', 'warning');
      }
    });
  
    // Configurar formularios
    configurarFormularios();
    
    // Cargar datos del usuario
    cargarDatosUsuario();
    
    // Configurar validación de contraseña en tiempo real
    const newPasswordInput = document.getElementById('new-password');
    if (newPasswordInput) {
      newPasswordInput.addEventListener('input', validarFortalezaContraseña);
    }
  });
  
  // Función para verificar si hay sesión activa
  async function verificarSesion() {
    const userSession = localStorage.getItem('userSession') || sessionStorage.getItem('userSession');
    
    if (!userSession) {
      // Si no hay sesión, redirigir a login.html
      window.location.href = 'login.html';
      return;
    }
    
    try {
      const sessionData = JSON.parse(userSession);
      // Actualizar nombre en el header si está disponible
      const userNameElement = document.querySelector('.user-name');
      if (userNameElement && sessionData.username) {
        userNameElement.textContent = sessionData.username;
      }

      // Verificar caducidad de contraseña
      await verificarCaducidadContraseña();
    } catch (error) {
      console.error('Error al procesar la sesión:', error);
    }
  }
  
  // Función para cambiar entre secciones
  function cambiarSeccion(sectionName) {
    // Actualizar navegación
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.remove('active');
    });
    document.querySelector(`[data-section="${sectionName}"]`).classList.add('active');
    
    // Mostrar sección correspondiente
    document.querySelectorAll('.profile-section').forEach(section => {
      section.classList.remove('active');
    });
    document.getElementById(`${sectionName}-section`).classList.add('active');
  }
  
  // Configurar todos los formularios
  function configurarFormularios() {
    // Formulario de información personal
    const personalForm = document.getElementById('personal-form');
    if (personalForm) {
      personalForm.addEventListener('submit', (e) => {
        e.preventDefault();
        guardarInformacionPersonal();
      });
    }
  
    // Formulario de empresa
    const companyForm = document.getElementById('company-form');
    if (companyForm) {
      companyForm.addEventListener('submit', (e) => {
        e.preventDefault();
        guardarInformacionEmpresa();
      });
    }
  
    // Formulario de preferencias
    const preferencesForm = document.getElementById('preferences-form');
    if (preferencesForm) {
      preferencesForm.addEventListener('submit', (e) => {
        e.preventDefault();
        guardarPreferencias();
      });
    }
  
    // Formulario de notificaciones
    const notificationsForm = document.getElementById('notifications-form');
    if (notificationsForm) {
      notificationsForm.addEventListener('submit', (e) => {
        e.preventDefault();
        guardarNotificaciones();
      });
    }
  
    // Formulario de cambio de contraseña
    const passwordForm = document.getElementById('password-form');
    if (passwordForm) {
      passwordForm.addEventListener('submit', (e) => {
        e.preventDefault();
        cambiarContraseña();
      });
    }
  }
  
  // Cargar datos del usuario en los formularios
  function cargarDatosUsuario() {
    // Información personal
    if (document.getElementById('nombre')) {
      document.getElementById('nombre').value = userData.nombre;
      document.getElementById('apellidos').value = userData.apellidos;
      document.getElementById('email').value = userData.email;
      document.getElementById('telefono').value = userData.telefono;
      document.getElementById('direccion').value = userData.direccion;
      
      // Actualizar nombre en el avatar
      document.getElementById('user-full-name').textContent = `${userData.nombre} ${userData.apellidos}`;
    }
  
    // Información de empresa
    if (document.getElementById('empresa-nombre')) {
      document.getElementById('empresa-nombre').value = userData.empresa.nombre;
      document.getElementById('rfc').value = userData.empresa.rfc;
      document.getElementById('cargo').value = userData.empresa.cargo;
      document.getElementById('direccion-empresa').value = userData.empresa.direccion;
    }
  
    // Preferencias
    if (document.getElementById('idioma')) {
      document.getElementById('idioma').value = userData.preferencias.idioma;
      document.getElementById('formato-fecha').value = userData.preferencias.formatoFecha;
      document.getElementById('tema').value = userData.preferencias.tema;
      document.getElementById('items-por-pagina').value = userData.preferencias.itemsPorPagina;
    }
  
    // Notificaciones
    if (document.getElementById('email-nuevas-referencias')) {
      document.getElementById('email-nuevas-referencias').checked = userData.notificaciones.emailNuevasReferencias;
      document.getElementById('email-actualizaciones').checked = userData.notificaciones.emailActualizaciones;
      document.getElementById('email-reportes').checked = userData.notificaciones.emailReportes;
      document.getElementById('sistema-alertas').checked = userData.notificaciones.sistemaAlertas;
      document.getElementById('sistema-mantenimiento').checked = userData.notificaciones.sistemaMantenimiento;
    }
  
    // Actualizar información de caducidad de contraseña
    actualizarInfoCaducidad();
  }
  
  // Guardar información personal
  function guardarInformacionPersonal() {
    userData.nombre = document.getElementById('nombre').value;
    userData.apellidos = document.getElementById('apellidos').value;
    userData.email = document.getElementById('email').value;
    userData.telefono = document.getElementById('telefono').value;
    userData.direccion = document.getElementById('direccion').value;
  
    // Actualizar nombre en el avatar
    document.getElementById('user-full-name').textContent = `${userData.nombre} ${userData.apellidos}`;
    
    // Actualizar nombre en el header
    const userNameElement = document.querySelector('.user-name');
    if (userNameElement) {
      userNameElement.textContent = userData.nombre;
    }
  
    mostrarAlerta('Información personal actualizada correctamente', 'success');
  }
  
  // Guardar información de empresa
  function guardarInformacionEmpresa() {
    userData.empresa.nombre = document.getElementById('empresa-nombre').value;
    userData.empresa.rfc = document.getElementById('rfc').value;
    userData.empresa.cargo = document.getElementById('cargo').value;
    userData.empresa.direccion = document.getElementById('direccion-empresa').value;
  
    mostrarAlerta('Información de empresa actualizada correctamente', 'success');
  }
  
  // Guardar preferencias
  function guardarPreferencias() {
    userData.preferencias.idioma = document.getElementById('idioma').value;
    userData.preferencias.formatoFecha = document.getElementById('formato-fecha').value;
    userData.preferencias.tema = document.getElementById('tema').value;
    userData.preferencias.itemsPorPagina = document.getElementById('items-por-pagina').value;
  
    // Aplicar tema si cambió
    const themeIcon = document.getElementById('theme-icon');
    
    if (userData.preferencias.tema === 'dark') {
      document.body.classList.add('dark-theme');
      if (themeIcon) themeIcon.textContent = 'dark_mode';
    } else {
      document.body.classList.remove('dark-theme');
      if (themeIcon) themeIcon.textContent = 'light_mode';
    }
    
    // Guardar tema en localStorage
    localStorage.setItem('theme', userData.preferencias.tema);
  
    mostrarAlerta('Preferencias guardadas correctamente', 'success');
  }
  
  // Guardar configuración de notificaciones
  function guardarNotificaciones() {
    userData.notificaciones.emailNuevasReferencias = document.getElementById('email-nuevas-referencias').checked;
    userData.notificaciones.emailActualizaciones = document.getElementById('email-actualizaciones').checked;
    userData.notificaciones.emailReportes = document.getElementById('email-reportes').checked;
    userData.notificaciones.sistemaAlertas = document.getElementById('sistema-alertas').checked;
    userData.notificaciones.sistemaMantenimiento = document.getElementById('sistema-mantenimiento').checked;
  
    mostrarAlerta('Configuración de notificaciones actualizada', 'success');
  }
  
  // Función para verificar la caducidad de la contraseña
  async function verificarCaducidadContraseña() {
    try {
      const response = await fetch(`${apiBase}/api/profile/password-status`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (!response.ok) {
        throw new Error('Error al verificar estado de contraseña');
      }

      const data = await response.json();
      const { ultimoCambio, diasRestantes, requiereCambio } = data;

      // Actualizar la UI con la información real
      actualizarInfoCaducidad(ultimoCambio, diasRestantes);

      // Si requiere cambio, forzar el modal
      if (requiereCambio) {
        mostrarModalContraseña(true);
        return true;
      }

      // Si faltan 15 días o menos, mostrar advertencia
      if (diasRestantes <= 15) {
        mostrarAlerta(`Tu contraseña caducará en ${diasRestantes} días. Por favor, cámbiala pronto.`, 'warning');
      }

      return false;
    } catch (error) {
      console.error('Error al verificar caducidad:', error);
      mostrarAlerta('Error al verificar el estado de tu contraseña', 'error');
      return false;
    }
  }

  // Función para actualizar la información de caducidad en la UI
  function actualizarInfoCaducidad(ultimoCambio, diasRestantes) {
    const ultimaActualizacion = document.getElementById('ultima-actualizacion');
    const expiryInfo = document.getElementById('password-expiry-info');

    if (ultimaActualizacion) {
      const fecha = new Date(ultimoCambio);
      const diasTranscurridos = Math.floor((new Date() - fecha) / (1000 * 60 * 60 * 24));
      ultimaActualizacion.textContent = `hace ${diasTranscurridos} días`;
    }

    if (expiryInfo) {
      if (diasRestantes <= 0) {
        expiryInfo.textContent = 'Tu contraseña ha caducado. Debes cambiarla ahora.';
        expiryInfo.style.color = '#ef4444';
      } else if (diasRestantes <= 15) {
        expiryInfo.textContent = `Tu contraseña caducará en ${diasRestantes} días.`;
        expiryInfo.style.color = '#f59e0b';
      } else {
        expiryInfo.textContent = `Tu contraseña caducará en ${diasRestantes} días.`;
        expiryInfo.style.color = '#10b981';
      }
    }
  }

  // Función para cambiar contraseña
  async function cambiarContraseña() {
    const currentPassword = document.getElementById('current-password').value;
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;

    // Validaciones
    if (newPassword !== confirmPassword) {
      mostrarAlerta('Las contraseñas no coinciden', 'error');
      return;
    }

    if (newPassword.length < 8) {
      mostrarAlerta('La contraseña debe tener al menos 8 caracteres', 'error');
      return;
    }

    try {
      const response = await fetch(`${apiBase}/api/profile/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          currentPassword,
          newPassword
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al cambiar la contraseña');
      }

      mostrarAlerta('Contraseña cambiada correctamente', 'success');
      cerrarModal();
      document.getElementById('password-form').reset();

      // Verificar el nuevo estado de la contraseña
      await verificarCaducidadContraseña();
    } catch (error) {
      console.error('Error al cambiar contraseña:', error);
      mostrarAlerta(error.message || 'Error al cambiar la contraseña', 'error');
    }
  }

  // Modificar la función mostrarModalContraseña para aceptar un parámetro de forzado
  function mostrarModalContraseña(forzado = false) {
    const modal = document.getElementById('passwordModal');
    const modalTitle = modal.querySelector('.modal-header h2');
    const cancelButton = modal.querySelector('.btn-secondary');
    
    if (forzado) {
      modalTitle.textContent = 'Cambio de Contraseña Obligatorio';
      cancelButton.style.display = 'none';
      modal.querySelector('.close').style.display = 'none';
    } else {
      modalTitle.textContent = 'Cambiar Contraseña';
      cancelButton.style.display = 'block';
      modal.querySelector('.close').style.display = 'block';
    }
    
    modal.style.display = 'block';
  }
  
  // Funciones de modal
  function mostrarModalContraseña() {
    const modal = document.getElementById('passwordModal');
    modal.style.display = 'block';
  }
  
  function cerrarModal() {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
      modal.style.display = 'none';
    });
  }
  
  // Configurar cierre de modales
  document.querySelectorAll('.close').forEach(closeBtn => {
    closeBtn.addEventListener('click', cerrarModal);
  });
  
  window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
      cerrarModal();
    }
  }
  
  // Función para cambiar avatar
  function cambiarAvatar() {
    // Aquí iría la lógica para subir una nueva imagen
    // Por ahora simulamos con un prompt
    const newAvatarUrl = prompt('Ingrese la URL de la nueva imagen de perfil:');
    if (newAvatarUrl) {
      document.getElementById('avatar-img').src = newAvatarUrl;
      mostrarAlerta('Avatar actualizado correctamente', 'success');
    }
  }
  
  // Ver sesiones activas
  function verSesiones() {
    const modal = document.getElementById('sessionsModal');
    const sessionsList = modal.querySelector('.sessions-list');
    
    // Simulamos sesiones activas
    const sesiones = [
      {
        dispositivo: 'Chrome - Windows',
        ubicacion: 'Veracruz, México',
        fecha: 'Hace 2 minutos',
        actual: true,
        icon: 'computer'
      },
      {
        dispositivo: 'Safari - iPhone',
        ubicacion: 'Ciudad de México',
        fecha: 'Hace 1 hora',
        actual: false,
        icon: 'smartphone'
      },
      {
        dispositivo: 'Firefox - MacOS',
        ubicacion: 'Guadalajara, México',
        fecha: 'Hace 3 días',
        actual: false,
        icon: 'laptop_mac'
      }
    ];
    
    // Generar HTML de sesiones
    sessionsList.innerHTML = sesiones.map(sesion => `
      <div class="session-item">
        <div class="session-info">
          <span class="material-icons session-icon">${sesion.icon}</span>
          <div class="session-details">
            <h4>${sesion.dispositivo} ${sesion.actual ? '<span class="current-session">(Sesión actual)</span>' : ''}</h4>
            <p>${sesion.ubicacion} • ${sesion.fecha}</p>
          </div>
        </div>
        ${!sesion.actual ? '<button class="btn-secondary" onclick="cerrarSesion(this)">Cerrar sesión</button>' : ''}
      </div>
    `).join('');
    
    modal.style.display = 'block';
  }
  
  // Cerrar sesión remota
  function cerrarSesion(button) {
    if (confirm('¿Estás seguro de que quieres cerrar esta sesión?')) {
      button.closest('.session-item').remove();
      mostrarAlerta('Sesión cerrada correctamente', 'success');
    }
  }
  
  // Función para cerrar sesión
  function logout() {
    if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
      // Eliminar datos de sesión
      localStorage.removeItem('userSession');
      sessionStorage.removeItem('userSession');
      
      // Redirigir a la página de login
      window.location.href = 'login.html';
    }
  }
  
  // Función para mostrar alertas
  function mostrarAlerta(mensaje, tipo = 'info') {
    // Crear elemento de alerta
    const alerta = document.createElement('div');
    alerta.className = `alert alert-${tipo}`;
    alerta.textContent = mensaje;
    
    // Estilos de la alerta
    alerta.style.position = 'fixed';
    alerta.style.top = '20px';
    alerta.style.right = '20px';
    alerta.style.padding = '15px 20px';
    alerta.style.borderRadius = '10px';
    alerta.style.color = 'white';
    alerta.style.zIndex = '1001';
    alerta.style.animation = 'slideIn 0.3s ease';
    
    // Color según el tipo
    switch(tipo) {
      case 'success':
        alerta.style.backgroundColor = '#10b981';
        break;
      case 'error':
        alerta.style.backgroundColor = '#ef4444';
        break;
      case 'warning':
        alerta.style.backgroundColor = '#f59e0b';
        break;
      default:
        alerta.style.backgroundColor = '#3b82f6';
    }
    
    document.body.appendChild(alerta);
    
    // Remover después de 3 segundos
    setTimeout(() => {
      alerta.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => {
        document.body.removeChild(alerta);
      }, 300);
    }, 3000);
  }
  
  // Animaciones para alertas
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideIn {
      from { transform: translateX(100%); }
      to { transform: translateX(0); }
    }
    
    @keyframes slideOut {
      from { transform: translateX(0); }
      to { transform: translateX(100%); }
    }
  `;
  document.head.appendChild(style);

  // Funciones de prueba para simular diferentes escenarios de caducidad
  function simularCambioContraseña() {
    // Simular cambio reciente (hace 1 día)
    const fecha = new Date();
    fecha.setDate(fecha.getDate() - 1);
    localStorage.setItem('ultimoCambioContraseña', fecha.toISOString());
    actualizarInfoCaducidad();
    mostrarAlerta('Se ha simulado un cambio de contraseña reciente (hace 1 día)', 'success');
  }

  function simularContraseñaPorCaducar() {
    // Simular contraseña por caducar (165 días)
    const fecha = new Date();
    fecha.setDate(fecha.getDate() - 165);
    localStorage.setItem('ultimoCambioContraseña', fecha.toISOString());
    actualizarInfoCaducidad();
    mostrarAlerta('Se ha simulado una contraseña por caducar (15 días restantes)', 'warning');
  }

  function simularContraseñaCaducada() {
    // Simular contraseña caducada (181 días)
    const fecha = new Date();
    fecha.setDate(fecha.getDate() - 181);
    localStorage.setItem('ultimoCambioContraseña', fecha.toISOString());
    actualizarInfoCaducidad();
    mostrarAlerta('Se ha simulado una contraseña caducada', 'error');
    // Forzar el modal de cambio de contraseña
    mostrarModalContraseña(true);
  }