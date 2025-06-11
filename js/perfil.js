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
  
  if (!token || !userSession) {
    console.log('❌ No hay sesión válida, redirigiendo a login...');
    window.location.href = 'login.html';
    return;
  }
  
  try {
    // Parsear los datos de sesión
    const sessionData = JSON.parse(userSession);
    console.log('✅ Datos de sesión recibidos:', sessionData);
    
    // Verificar expiración (opcional, más flexible)
    const loginTime = new Date(sessionData.loginTime);
    const currentTime = new Date();
    const hoursSinceLogin = (currentTime - loginTime) / (1000 * 60 * 60);
    
    if (hoursSinceLogin > 24) { // 24 horas en lugar de 8
      console.log('⚠️ Sesión expirada, pero permitiendo acceso...');
    }
    
    // 🔥 CORREGIR: Usar datos reales de la sesión, no datos hardcodeados
    userData = {
      id: sessionData.id,
      // Dividir el nombre completo en nombre y apellidos
      nombre: sessionData.name ? sessionData.name.split(' ').slice(0, 2).join(' ') : 'Usuario',
      apellidos: sessionData.name ? sessionData.name.split(' ').slice(2).join(' ') : '',
      nombreCompleto: sessionData.name || 'Usuario',
      email: sessionData.email || 'no-email@domain.com',
      username: sessionData.username || 'usuario',
      role: sessionData.role || 'USER',
      idCliente: sessionData.idCliente || sessionData.id || 'N/A',
      // Datos que pueden venir de la sesión o usar defaults
      telefono: sessionData.telefono || "+52 961 573 5235",
      direccion: sessionData.direccion || "Veracruz, Ver.",
      loginTime: sessionData.loginTime,
      empresa: {
        nombre: sessionData.empresa || "Agencia Aduanal Rodall Oseguera",
        rfc: sessionData.rfc || "N/A",
        cargo: sessionData.role,
        direccion: sessionData.direccionEmpresa || "Av. Francisco I. Madero 33, Centro, 91700 Veracruz."
      }
    };
    
    console.log('✅ UserData configurado con datos reales:', userData);
    
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

  // Configurar formularios (solo para preferencias y seguridad)
  configurarFormularios();
  
  // 🔥 IMPORTANTE: Cargar datos del usuario REAL en la vista
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
  if (userNameElement && userData.nombreCompleto) {
    userNameElement.textContent = userData.nombreCompleto;
  }
  
  // Actualizar información de usuario en la página
  const userFullName = document.getElementById('user-full-name');
  if (userFullName) {
    userFullName.textContent = userData.nombreCompleto;
  }
  
  const userRole = document.querySelector('.user-role');
  if (userRole) {
    userRole.textContent = formatearRol(userData.role);
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

// 🔥 FUNCIÓN CORREGIDA: Cargar datos REALES del usuario
function cargarDatosUsuario() {
  console.log('🔄 Cargando datos del usuario:', userData);
  
  // ===== INFORMACIÓN PERSONAL CON DATOS REALES =====
  
  // Actualizar nombre completo en el avatar
  const userFullNameElement = document.getElementById('user-full-name');
  if (userFullNameElement) {
    userFullNameElement.textContent = userData.nombreCompleto;
  }
  
  // Actualizar rol en el avatar
  const userRoleElement = document.querySelector('.user-role');
  if (userRoleElement) {
    userRoleElement.textContent = formatearRol(userData.role);
  }
  
  // Actualizar fecha de usuario desde (usar loginTime o fecha por defecto)
  const userSinceElement = document.querySelector('.user-since');
  if (userSinceElement) {
    const fechaRegistro = userData.loginTime ? 
      new Date(userData.loginTime).toLocaleDateString('es-ES', { year: 'numeric', month: 'long' }) :
      'Marzo 2025';
    userSinceElement.textContent = `Usuario desde: ${fechaRegistro}`;
  }
  
  // ===== CAMPOS DEL FORMULARIO CON DATOS REALES =====
  
  // Campo Nombre
  const nombreInput = document.getElementById('nombre');
  if (nombreInput) {
    nombreInput.value = userData.nombre || '';
  }
  
  // Campo Apellidos
  const apellidosInput = document.getElementById('apellidos');
  if (apellidosInput) {
    apellidosInput.value = userData.apellidos || '';
  }
  
  // Campo Email
  const emailInput = document.getElementById('email');
  if (emailInput) {
    emailInput.value = userData.email || '';
  }
  
  // Campo Teléfono
  const telefonoInput = document.getElementById('telefono');
  if (telefonoInput) {
    telefonoInput.value = userData.telefono || '';
  }
  
  // Campo Dirección
  const direccionInput = document.getElementById('direccion');
  if (direccionInput) {
    direccionInput.value = userData.direccion || '';
  }
  
  // ===== ELEMENTOS DE SOLO LECTURA (SI EXISTEN) =====
  
  // Username (si existe un elemento para mostrarlo)
  const usernameElement = document.getElementById('display-username');
  if (usernameElement) {
    usernameElement.textContent = userData.username;
  }
  
  // ID Cliente
  const idClienteElement = document.getElementById('display-id-cliente');
  if (idClienteElement) {
    idClienteElement.textContent = userData.idCliente;
  }
  
  // Información empresarial
  const empresaElement = document.getElementById('display-empresa');
  if (empresaElement) {
    empresaElement.textContent = userData.empresa.nombre;
  }
  
  // ===== INFORMACIÓN DE SEGURIDAD =====
  
  // Última actualización de contraseña (calcular desde loginTime si es disponible)
  const ultimaActualizacionElement = document.getElementById('ultima-actualizacion');
  if (ultimaActualizacionElement && userData.loginTime) {
    const diasDesdeLogin = Math.floor((new Date() - new Date(userData.loginTime)) / (1000 * 60 * 60 * 24));
    ultimaActualizacionElement.textContent = `hace ${diasDesdeLogin} días`;
  }
  
  // ===== CARGAR PREFERENCIAS GUARDADAS =====
  const itemsPorPagina = localStorage.getItem('itemsPorPagina');
  if (itemsPorPagina && document.getElementById('items-por-pagina')) {
    document.getElementById('items-por-pagina').value = itemsPorPagina;
  }
  
  console.log('✅ Datos del usuario cargados en la interfaz');
}

// Función para formatear nombres de roles
function formatearRol(role) {
  const roleMap = {
    'ADMIN': 'Administrador',
    'ADMINISTRADOR': 'Administrador',
    'CLIENTE': 'Cliente',
    'USER': 'Usuario',
    'EJECUTIVO_CUENTA': 'Ejecutivo de Cuenta'
  };
  
  return roleMap[role] || role;
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

// Función para ver sesiones (placeholder)
function verSesiones() {
  mostrarAlerta('Función de sesiones activas en desarrollo');
}