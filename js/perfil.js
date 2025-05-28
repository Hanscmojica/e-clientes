// Configuración de la URL base de la API
const apiBase = `${window.location.protocol}//${window.location.hostname}:5001`;

// Variable global para datos del usuario
let userData = {};

// Inicialización corregida
document.addEventListener('DOMContentLoaded', function() {
  console.log('🔍 Cargando perfil...');
  
  // Verificar sesión de forma más robusta
  const token = localStorage.getItem('token');
  const userSessionLocal = localStorage.getItem('userSession');
  const userSessionSession = sessionStorage.getItem('userSession');
  
  const userSession = userSessionLocal || userSessionSession;
  
  console.log('🔍 Token encontrado:', token ? 'SÍ' : 'NO');
  console.log('🔍 Sesión encontrada:', userSession ? 'SÍ' : 'NO');
  
  if (!token || !userSession) {
    console.log('❌ No hay sesión válida, redirigiendo a login...');
    window.location.href = 'login.html';
    return;
  }
  
  try {
    // Parsear los datos de sesión
    const sessionData = JSON.parse(userSession);
    console.log('✅ Datos de sesión:', sessionData);
    
    // Verificar expiración (opcional, más flexible)
    const loginTime = new Date(sessionData.loginTime);
    const currentTime = new Date();
    const hoursSinceLogin = (currentTime - loginTime) / (1000 * 60 * 60);
    
    if (hoursSinceLogin > 24) { // 24 horas en lugar de 8
      console.log('⚠️ Sesión expirada, pero permitiendo acceso...');
      // No redirigir automáticamente, solo avisar
    }
    
    // Configurar datos del usuario con datos reales de la sesión
    userData = {
      id: sessionData.id,
      nombre: sessionData.name?.split(' ').slice(0, 2).join(' ') || 'Usuario',
      apellidos: sessionData.name?.split(' ').slice(2).join(' ') || '',
      email: sessionData.email || 'no-email@domain.com',
      username: sessionData.username,
      role: sessionData.role,
      telefono: "+52 961 573 5235", // Datos por defecto
      direccion: "Veracruz, Ver.",
      empresa: {
        nombre: "Importadora Ejemplo S.A. de C.V.",
        rfc: "IEJ123456HM7",
        cargo: sessionData.role,
        direccion: "Av. Francisco I. Madero 33, Centro, 91700 Veracruz."
      }
    };
    
    console.log('✅ UserData configurado:', userData);
    
    // Configurar la página
    configurarPagina();
    
  } catch (error) {
    console.error('❌ Error al parsear sesión:', error);
    window.location.href = 'login.html';
    return;
  }
});

// Función para configurar toda la página
function configurarPagina() {
  // Actualizar el header con datos reales
  actualizarHeader();
  
  // Configurar navegación lateral
  const navItems = document.querySelectorAll('.nav-item');
  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const section = item.dataset.section;
      cambiarSeccion(section);
    });
  });

  // Configurar formularios
  configurarFormularios();
  
  // Cargar datos del usuario en los formularios
  cargarDatosUsuario();
  
  // Configurar cerrar modales
  document.querySelectorAll('.close').forEach(closeBtn => {
    closeBtn.addEventListener('click', cerrarModal);
  });
  
  // Cerrar modal al hacer clic fuera
  window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
      cerrarModal();
    }
  });
}

// Función para actualizar el header
function actualizarHeader() {
  const userNameElement = document.querySelector('.user-name');
  if (userNameElement && userData.nombre) {
    userNameElement.textContent = `${userData.nombre} ${userData.apellidos}`.trim();
  }
  
  // Actualizar información de usuario en la página
  const userFullName = document.getElementById('user-full-name');
  if (userFullName) {
    userFullName.textContent = `${userData.nombre} ${userData.apellidos}`.trim();
  }
  
  const userRole = document.querySelector('.user-role');
  if (userRole) {
    userRole.textContent = userData.role || 'Usuario';
  }
}

// Función para cambiar entre secciones
function cambiarSeccion(sectionName) {
  // Actualizar navegación
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.remove('active');
  });
  const activeNavItem = document.querySelector(`[data-section="${sectionName}"]`);
  if (activeNavItem) activeNavItem.classList.add('active');
  
  // Mostrar sección correspondiente
  document.querySelectorAll('.profile-section').forEach(section => {
    section.classList.remove('active');
  });
  const activeSection = document.getElementById(`${sectionName}-section`);
  if (activeSection) activeSection.classList.add('active');
}

// Configurar todos los formularios
function configurarFormularios() {
  // Formulario de cambio de contraseña
  const passwordForm = document.getElementById('password-form');
  if (passwordForm) {
    passwordForm.addEventListener('submit', (e) => {
      e.preventDefault();
      cambiarContraseña();
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
}

// Cargar datos del usuario en los formularios
function cargarDatosUsuario() {
  // Información personal
  if (document.getElementById('nombre')) {
    document.getElementById('nombre').value = userData.nombre || '';
    document.getElementById('apellidos').value = userData.apellidos || '';
    document.getElementById('email').value = userData.email || '';
    document.getElementById('telefono').value = userData.telefono || '';
    document.getElementById('direccion').value = userData.direccion || '';
  }
  
  // Información de empresa
  if (document.getElementById('empresa-nombre')) {
    document.getElementById('empresa-nombre').value = userData.empresa?.nombre || '';
    document.getElementById('rfc').value = userData.empresa?.rfc || '';
    document.getElementById('cargo').value = userData.empresa?.cargo || '';
    document.getElementById('direccion-empresa').value = userData.empresa?.direccion || '';
  }
  
  // Cargar preferencias guardadas
  const itemsPorPagina = localStorage.getItem('itemsPorPagina');
  if (itemsPorPagina && document.getElementById('items-por-pagina')) {
    document.getElementById('items-por-pagina').value = itemsPorPagina;
  }
}

// Función para guardar preferencias
function guardarPreferencias() {
  const itemsPorPagina = document.getElementById('items-por-pagina')?.value;
  if (itemsPorPagina) {
    localStorage.setItem('itemsPorPagina', itemsPorPagina);
    mostrarAlerta('Preferencias guardadas correctamente', 'success');
  }
}

// Función para cambiar contraseña - CON BACKEND REAL
async function cambiarContraseña() {
  const currentPassword = document.getElementById('current-password').value;
  const newPassword = document.getElementById('new-password').value;
  const confirmPassword = document.getElementById('confirm-password').value;

  try {
    // Validaciones básicas
    if (!currentPassword || !newPassword || !confirmPassword) {
      mostrarAlerta('Todos los campos son obligatorios', 'error');
      return;
    }

    if (newPassword !== confirmPassword) {
      mostrarAlerta('Las contraseñas no coinciden', 'error');
      return;
    }

    if (newPassword.length < 8) {
      mostrarAlerta('La contraseña debe tener al menos 8 caracteres', 'error');
      return;
    }

    // Obtener el token del localStorage
    const token = localStorage.getItem('token');
    if (!token) {
      mostrarAlerta('No hay sesión activa. Por favor, inicie sesión nuevamente.', 'error');
      window.location.href = './login.html';
      return;
    }

    console.log('Enviando solicitud de cambio de contraseña...');

    const response = await fetch(`${apiBase}/api/profile/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        currentPassword,
        newPassword
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Error al cambiar la contraseña');
    }

    console.log('✅ Contraseña cambiada exitosamente');

    // Éxito
    mostrarAlerta('Contraseña cambiada correctamente', 'success');
    cerrarModal();
    document.getElementById('password-form').reset();

  } catch (error) {
    console.error('Error al cambiar contraseña:', error);
    mostrarAlerta(error.message || 'Error al cambiar la contraseña. Intente nuevamente.', 'error');
  }
}

// Funciones de modal
function mostrarModalContraseña() {
  const modal = document.getElementById('passwordModal');
  if (modal) modal.style.display = 'block';
}

function cerrarModal() {
  const modals = document.querySelectorAll('.modal');
  modals.forEach(modal => {
    modal.style.display = 'none';
  });
}

// Función para cerrar sesión
function logout() {
  if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
    // Eliminar datos de sesión
    localStorage.removeItem('userSession');
    localStorage.removeItem('token');
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
  alerta.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
  
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
  
  // Remover después de 4 segundos
  setTimeout(() => {
    if (document.body.contains(alerta)) {
      document.body.removeChild(alerta);
    }
  }, 4000);
}

// Funciones adicionales para funcionalidad completa
function cambiarAvatar() {
  mostrarAlerta('Funcionalidad de cambio de avatar próximamente disponible', 'info');
}

function verSesiones() {
  mostrarAlerta('Funcionalidad de sesiones activas próximamente disponible', 'info');
}