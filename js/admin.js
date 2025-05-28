// Configuración de la API
const apiBase = 'http://localhost:5001';

// Variables globales
let usuarios = [];
let currentSection = 'dashboard';
let currentPage = 1;
let usersPerPage = 10;

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
  console.log('🔧 Cargando panel de administrador...');
  
  // Verificación simple - solo comprobar si hay sesión
  const userSession = JSON.parse(localStorage.getItem('userSession') || sessionStorage.getItem('userSession') || 'null');
  
  if (!userSession) {
    console.log('❌ No hay sesión, redirigiendo...');
    window.location.href = 'login.html';
    return;
  }
  
  console.log('✅ Sesión encontrada:', userSession);
  
  // Actualizar header con datos reales
  const userNameElement = document.querySelector('.user-name');
  const userIdElement = document.querySelector('.user-id');
  if (userNameElement) userNameElement.textContent = userSession.name || userSession.username;
  if (userIdElement) userIdElement.textContent = `(ID: ${userSession.id})`;
  
  // Configurar logout
  const logoutBtn = document.querySelector('.logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', logout);
  }
  
  // Configurar navegación
  configurarNavegacion();
  
  // Configurar modales
  configurarModales();
  
  // Configurar formularios
  configurarFormularios();
  
  // Configurar búsqueda y filtros
  configurarBusquedaYFiltros();
  
  // Cargar dashboard
  cargarDashboard();
  
  console.log('✅ Panel admin cargado exitosamente');
});

// Función para obtener token
function getAuthToken() {
  const userSession = JSON.parse(localStorage.getItem('userSession') || sessionStorage.getItem('userSession') || 'null');
  return userSession ? userSession.token : null;
}

// Configurar navegación del sidebar
function configurarNavegacion() {
  const navItems = document.querySelectorAll('.admin-nav .nav-item');
  
  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const section = item.dataset.section;
      cambiarSeccion(section);
    });
  });
}

// Cambiar sección activa
function cambiarSeccion(sectionName) {
  // Actualizar navegación
  document.querySelectorAll('.admin-nav .nav-item').forEach(item => {
    item.classList.remove('active');
  });
  const activeNavItem = document.querySelector(`[data-section="${sectionName}"]`);
  if (activeNavItem) activeNavItem.classList.add('active');
  
  // Mostrar sección correspondiente
  document.querySelectorAll('.admin-section').forEach(section => {
    section.classList.remove('active');
  });
  const activeSection = document.getElementById(`${sectionName}-section`);
  if (activeSection) activeSection.classList.add('active');
  
  currentSection = sectionName;
  
  // Cargar datos específicos de la sección
  switch(sectionName) {
    case 'dashboard':
      cargarDashboard();
      break;
    case 'usuarios':
      cargarUsuarios();
      break;
    case 'perfiles':
      cargarPerfiles();
      break;
    case 'permisos':
      cargarPermisos();
      break;
    case 'logs':
      cargarLogs();
      break;
    case 'configuracion':
      mostrarAlerta('Configuración cargada', 'success');
      break;
  }
}

// ===============================
// DASHBOARD
// ===============================

// Cargar dashboard
function cargarDashboard() {
  // Datos de ejemplo con animación
  setTimeout(() => {
    document.getElementById('total-usuarios').textContent = '6';
  }, 100);
  
  setTimeout(() => {
    document.getElementById('usuarios-activos').textContent = '5';
  }, 200);
  
  setTimeout(() => {
    document.getElementById('logins-hoy').textContent = '12';
  }, 300);
  
  setTimeout(() => {
    document.getElementById('referencias-mes').textContent = '45';
  }, 400);
  
  const activityList = document.getElementById('activity-list');
  activityList.innerHTML = `
    <div class="activity-item">
      <span class="material-icons">login</span>
      <span>HANS inició sesión - hace 2 minutos</span>
    </div>
    <div class="activity-item">
      <span class="material-icons">person_add</span>
      <span>Usuario GHERSON consultó referencias - hace 1 hora</span>
    </div>
    <div class="activity-item">
      <span class="material-icons">assignment</span>
      <span>15 referencias consultadas - hace 3 horas</span>
    </div>
    <div class="activity-item">
      <span class="material-icons">security</span>
      <span>Sistema actualizado - hace 2 horas</span>
    </div>
  `;
}

// ===============================
// GESTIÓN DE USUARIOS
// ===============================

// Cargar usuarios
function cargarUsuarios() {
  const tableBody = document.getElementById('usuarios-table-body');
  tableBody.innerHTML = '<tr><td colspan="8" class="loading">Cargando usuarios...</td></tr>';
  
  // Simular carga
  setTimeout(() => {
    // Usuarios de ejemplo más completos
    usuarios = [
      { 
        id: 5951, 
        username: 'HANS', 
        name: 'Hans Hansen Mojica', 
        email: 'hans@hotmail.com', 
        role: 'ADMIN', 
        active: true, 
        lastLogin: '2025-01-27 15:30:00',
        idCliente: 5951,
        perfil: 'ADMIN'
      },
      { 
        id: 1, 
        username: 'JOSUE', 
        name: 'Josue Perez Eulogio', 
        email: 'josue@hotmail.com', 
        role: 'ADMINISTRADOR', 
        active: true, 
        lastLogin: '2025-01-26 09:15:00',
        idCliente: 1,
        perfil: 'ADMINISTRADOR'
      },
      { 
        id: 3159, 
        username: 'GHERSON', 
        name: 'Gherson Mena Mena', 
        email: 'gherson@hotmail.com', 
        role: 'CLIENTE', 
        active: true, 
        lastLogin: '2025-01-26 13:10:00',
        idCliente: 3159,
        perfil: 'CLIENTE'
      },
      { 
        id: 2, 
        username: 'PANCHO', 
        name: 'Pancho Mendez Lorenzo', 
        email: 'pancho@hotmail.com', 
        role: 'CLIENTE', 
        active: true, 
        lastLogin: '2025-01-25 14:22:00',
        idCliente: 2,
        perfil: 'CLIENTE'
      },
      { 
        id: 4, 
        username: 'MANUEL', 
        name: 'Manuel Perez Perez', 
        email: 'manuel@gmail.com', 
        role: 'CLIENTE', 
        active: false, 
        lastLogin: '2025-01-15 16:30:00',
        idCliente: 4,
        perfil: 'CLIENTE'
      }
    ];
    
    mostrarUsuarios(usuarios);
  }, 500);
}

// Mostrar usuarios en la tabla
function mostrarUsuarios(usuariosList) {
  const tableBody = document.getElementById('usuarios-table-body');
  
  if (usuariosList.length === 0) {
    tableBody.innerHTML = '<tr><td colspan="8" class="no-data">No se encontraron usuarios</td></tr>';
    return;
  }
  
  tableBody.innerHTML = usuariosList.map(usuario => `
    <tr>
      <td>${usuario.id}</td>
      <td>
        <div class="user-cell">
          <div class="user-avatar">
            <span class="material-icons">person</span>
          </div>
          <strong>${usuario.username}</strong>
        </div>
      </td>
      <td>${usuario.name}</td>
      <td>${usuario.email}</td>
      <td>
        <span class="role-badge role-${usuario.role.toLowerCase()}">${usuario.role}</span>
      </td>
      <td>
        <span class="status-badge ${usuario.active ? 'active' : 'inactive'}">
          ${usuario.active ? 'Activo' : 'Inactivo'}
        </span>
      </td>
      <td>${formatearFecha(usuario.lastLogin)}</td>
      <td>
        <div class="action-buttons">
          <button class="btn-icon" onclick="editarUsuario(${usuario.id})" title="Editar">
            <span class="material-icons">edit</span>
          </button>
          <button class="btn-icon" onclick="toggleUsuarioStatus(${usuario.id})" title="${usuario.active ? 'Desactivar' : 'Activar'}">
            <span class="material-icons">${usuario.active ? 'block' : 'check_circle'}</span>
          </button>
          <button class="btn-icon danger" onclick="eliminarUsuario(${usuario.id})" title="Eliminar">
            <span class="material-icons">delete</span>
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

// Configurar búsqueda y filtros
function configurarBusquedaYFiltros() {
  const searchInput = document.getElementById('search-usuarios');
  const filterRole = document.getElementById('filter-role');
  const filterStatus = document.getElementById('filter-status');
  
  if (searchInput) {
    searchInput.addEventListener('input', filtrarUsuarios);
  }
  
  if (filterRole) {
    filterRole.addEventListener('change', filtrarUsuarios);
  }
  
  if (filterStatus) {
    filterStatus.addEventListener('change', filtrarUsuarios);
  }
}

// Filtrar usuarios
function filtrarUsuarios() {
  const searchTerm = document.getElementById('search-usuarios')?.value.toLowerCase() || '';
  const roleFilter = document.getElementById('filter-role')?.value || '';
  const statusFilter = document.getElementById('filter-status')?.value || '';
  
  let usuariosFiltrados = usuarios.filter(usuario => {
    const matchSearch = !searchTerm || 
      usuario.username.toLowerCase().includes(searchTerm) ||
      usuario.name.toLowerCase().includes(searchTerm) ||
      usuario.email.toLowerCase().includes(searchTerm);
      
    const matchRole = !roleFilter || usuario.role === roleFilter;
    const matchStatus = !statusFilter || usuario.active.toString() === statusFilter;
    
    return matchSearch && matchRole && matchStatus;
  });
  
  mostrarUsuarios(usuariosFiltrados);
}

// ===============================
// ACCIONES DE USUARIOS
// ===============================

// Editar usuario
function editarUsuario(userId) {
  const usuario = usuarios.find(u => u.id === userId);
  if (!usuario) {
    mostrarAlerta('Usuario no encontrado', 'error');
    return;
  }
  
  mostrarAlerta(`Editando usuario: ${usuario.username}`, 'info');
  
  // Simular carga de datos en el modal
  setTimeout(() => {
    mostrarModalCrearUsuario();
    
    // Pre-llenar con datos del usuario (si el modal estuviera implementado)
    console.log('Datos del usuario a editar:', usuario);
  }, 300);
}

// Toggle estado del usuario
function toggleUsuarioStatus(userId) {
  const usuario = usuarios.find(u => u.id === userId);
  if (!usuario) {
    mostrarAlerta('Usuario no encontrado', 'error');
    return;
  }
  
  const nuevoEstado = !usuario.active;
  const accion = nuevoEstado ? 'activar' : 'desactivar';
  
  if (!confirm(`¿Estás seguro de ${accion} al usuario ${usuario.username}?`)) {
    return;
  }
  
  // Simular petición al servidor
  mostrarAlerta(`${accion.charAt(0).toUpperCase() + accion.slice(1)}ando usuario...`, 'info');
  
  setTimeout(() => {
    usuario.active = nuevoEstado;
    mostrarUsuarios(usuarios);
    mostrarAlerta(`Usuario ${accion}do exitosamente`, 'success');
  }, 1000);
}

// Eliminar usuario
function eliminarUsuario(userId) {
  const usuario = usuarios.find(u => u.id === userId);
  if (!usuario) {
    mostrarAlerta('Usuario no encontrado', 'error');
    return;
  }
  
  if (!confirm(`¿Estás seguro de eliminar al usuario ${usuario.username}?\n\nEsta acción no se puede deshacer.`)) {
    return;
  }
  
  // Simular eliminación
  mostrarAlerta('Eliminando usuario...', 'warning');
  
  setTimeout(() => {
    usuarios = usuarios.filter(u => u.id !== userId);
    mostrarUsuarios(usuarios);
    mostrarAlerta('Usuario eliminado exitosamente', 'success');
  }, 1000);
}

// ===============================
// OTRAS SECCIONES
// ===============================

// Cargar perfiles
function cargarPerfiles() {
  const profilesGrid = document.getElementById('profiles-grid');
  
  profilesGrid.innerHTML = `
    <div class="profile-card">
      <div class="profile-header">
        <span class="material-icons">badge</span>
        <h3>ADMIN</h3>
      </div>
      <div class="profile-body">
        <p>Administrador con acceso total al sistema</p>
        <div class="profile-stats">
          <div class="stat">
            <span class="stat-number">1</span>
            <span class="stat-label">Usuarios</span>
          </div>
          <div class="stat">
            <span class="stat-number">5</span>
            <span class="stat-label">Permisos</span>
          </div>
        </div>
      </div>
    </div>
    
    <div class="profile-card">
      <div class="profile-header">
        <span class="material-icons">badge</span>
        <h3>CLIENTE</h3>
      </div>
      <div class="profile-body">
        <p>Cliente con acceso a sus referencias</p>
        <div class="profile-stats">
          <div class="stat">
            <span class="stat-number">3</span>
            <span class="stat-label">Usuarios</span>
          </div>
          <div class="stat">
            <span class="stat-number">2</span>
            <span class="stat-label">Permisos</span>
          </div>
        </div>
      </div>
    </div>
    
    <div class="profile-card">
      <div class="profile-header">
        <span class="material-icons">badge</span>
        <h3>ADMINISTRADOR</h3>
      </div>
      <div class="profile-body">
        <p>Administrador del sistema</p>
        <div class="profile-stats">
          <div class="stat">
            <span class="stat-number">1</span>
            <span class="stat-label">Usuarios</span>
          </div>
          <div class="stat">
            <span class="stat-number">4</span>
            <span class="stat-label">Permisos</span>
          </div>
        </div>
      </div>
    </div>
  `;
}

// Cargar permisos
function cargarPermisos() {
  const permissionsMatrix = document.getElementById('permissions-matrix');
  
  permissionsMatrix.innerHTML = `
    <table class="permissions-table">
      <thead>
        <tr>
          <th>Permiso</th>
          <th>ADMIN</th>
          <th>ADMINISTRADOR</th>
          <th>CLIENTE</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>READ_REFERENCES</strong><br><small>Leer referencias</small></td>
          <td class="permission-cell">
            <label class="switch">
              <input type="checkbox" checked onclick="togglePermiso('READ_REFERENCES', 'ADMIN', this.checked)">
              <span class="slider"></span>
            </label>
          </td>
          <td class="permission-cell">
            <label class="switch">
              <input type="checkbox" checked onclick="togglePermiso('READ_REFERENCES', 'ADMINISTRADOR', this.checked)">
              <span class="slider"></span>
            </label>
          </td>
          <td class="permission-cell">
            <label class="switch">
              <input type="checkbox" checked onclick="togglePermiso('READ_REFERENCES', 'CLIENTE', this.checked)">
              <span class="slider"></span>
            </label>
          </td>
        </tr>
        <tr>
          <td><strong>ADMIN_USERS</strong><br><small>Administrar usuarios</small></td>
          <td class="permission-cell">
            <label class="switch">
              <input type="checkbox" checked onclick="togglePermiso('ADMIN_USERS', 'ADMIN', this.checked)">
              <span class="slider"></span>
            </label>
          </td>
          <td class="permission-cell">
            <label class="switch">
              <input type="checkbox" onclick="togglePermiso('ADMIN_USERS', 'ADMINISTRADOR', this.checked)">
              <span class="slider"></span>
            </label>
          </td>
          <td class="permission-cell">
            <label class="switch">
              <input type="checkbox" onclick="togglePermiso('ADMIN_USERS', 'CLIENTE', this.checked)">
              <span class="slider"></span>
            </label>
          </td>
        </tr>
        <tr>
          <td><strong>VIEW_LOGS</strong><br><small>Ver logs del sistema</small></td>
          <td class="permission-cell">
            <label class="switch">
              <input type="checkbox" checked onclick="togglePermiso('VIEW_LOGS', 'ADMIN', this.checked)">
              <span class="slider"></span>
            </label>
          </td>
          <td class="permission-cell">
            <label class="switch">
              <input type="checkbox" checked onclick="togglePermiso('VIEW_LOGS', 'ADMINISTRADOR', this.checked)">
              <span class="slider"></span>
            </label>
          </td>
          <td class="permission-cell">
            <label class="switch">
              <input type="checkbox" onclick="togglePermiso('VIEW_LOGS', 'CLIENTE', this.checked)">
              <span class="slider"></span>
            </label>
          </td>
        </tr>
      </tbody>
    </table>
  `;
}

// Toggle permiso
function togglePermiso(permiso, perfil, activo) {
  console.log(`${activo ? 'Activando' : 'Desactivando'} permiso ${permiso} para perfil ${perfil}`);
  mostrarAlerta(`Permiso ${permiso} ${activo ? 'activado' : 'desactivado'} para ${perfil}`, 'success');
}

// Cargar logs
function cargarLogs() {
  const logsTable = document.getElementById('logs-table');
  
  const logsEjemplo = [
    { id: 1, usuario: 'HANS', tipo: 'LOGIN', descripcion: 'Inicio de sesión exitoso', ip: '192.168.1.100', timestamp: '2025-01-27 15:30:00' },
    { id: 2, usuario: 'GHERSON', tipo: 'LOGIN', descripcion: 'Inicio de sesión exitoso', ip: '192.168.1.101', timestamp: '2025-01-27 13:10:00' },
    { id: 3, usuario: 'JOSUE', tipo: 'CHANGE_PASSWORD', descripcion: 'Cambio de contraseña', ip: '192.168.1.102', timestamp: '2025-01-26 09:15:00' },
    { id: 4, usuario: 'PEDRO', tipo: 'LOGIN_FAILED', descripcion: 'Intento de login fallido', ip: '192.168.1.103', timestamp: '2025-01-25 16:22:00' },
    { id: 5, usuario: 'HANS', tipo: 'USER_UPDATED', descripcion: 'Usuario GHERSON actualizado', ip: '192.168.1.100', timestamp: '2025-01-25 10:30:00' },
  ];
  
  logsTable.innerHTML = `
    <table class="admin-table">
      <thead>
        <tr>
          <th>Fecha/Hora</th>
          <th>Usuario</th>
          <th>Tipo</th>
          <th>Descripción</th>
          <th>IP</th>
        </tr>
      </thead>
      <tbody>
        ${logsEjemplo.map(log => `
          <tr>
            <td>${formatearFecha(log.timestamp)}</td>
            <td>${log.usuario}</td>
            <td>
              <span class="log-type log-${log.tipo.toLowerCase()}">${log.tipo}</span>
            </td>
            <td>${log.descripcion}</td>
            <td>${log.ip}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

// Filtrar logs
function filtrarLogs() {
  const startDate = document.getElementById('log-date-start')?.value;
  const endDate = document.getElementById('log-date-end')?.value;
  const logType = document.getElementById('log-type')?.value;
  
  console.log('Filtrar logs:', { startDate, endDate, logType });
  mostrarAlerta('Filtros aplicados a los logs', 'success');
  
  // Recargar logs con filtros
  setTimeout(() => {
    cargarLogs();
  }, 500);
}

// ===============================
// MODALES
// ===============================

// Configurar modales
function configurarModales() {
  const closeButtons = document.querySelectorAll('.modal .close');
  
  closeButtons.forEach(btn => {
    btn.addEventListener('click', cerrarModal);
  });
  
  window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
      cerrarModal();
    }
  });
}

// Mostrar modal crear usuario
function mostrarModalCrearUsuario() {
  mostrarAlerta('Abriendo formulario de creación de usuario...', 'info');
  
  // Simular modal
  setTimeout(() => {
    const modalData = {
      nombre: '',
      apellidoPaterno: '',
      apellidoMaterno: '',
      username: '',
      email: '',
      idCliente: '',
      perfil: 'CLIENTE'
    };
    
    const datos = prompt(`Crear nuevo usuario (formato JSON):\n\nEjemplo:\n{\n  "username": "NUEVO_USER",\n  "nombre": "Nombre Usuario",\n  "email": "user@email.com",\n  "idCliente": "1234",\n  "perfil": "CLIENTE"\n}\n\nIngresa los datos:`, JSON.stringify(modalData, null, 2));
    
    if (datos) {
      try {
        const nuevoUsuario = JSON.parse(datos);
        crearUsuario(nuevoUsuario);
      } catch (error) {
        mostrarAlerta('Formato JSON inválido', 'error');
      }
    }
  }, 500);
}

// Crear usuario
function crearUsuario(userData) {
  if (!userData.username || !userData.email) {
    mostrarAlerta('Username y email son requeridos', 'error');
    return;
  }
  
  mostrarAlerta('Creando usuario...', 'info');
  
  setTimeout(() => {
    const nuevoUsuario = {
      id: Date.now(), // ID temporal
      username: userData.username,
      name: userData.nombre || userData.username,
      email: userData.email,
      role: userData.perfil || 'CLIENTE',
      active: true,
      lastLogin: null,
      idCliente: userData.idCliente || Date.now()
    };
    
    usuarios.push(nuevoUsuario);
    mostrarUsuarios(usuarios);
    mostrarAlerta(`Usuario ${userData.username} creado exitosamente`, 'success');
  }, 1000);
}

// Configurar formularios
function configurarFormularios() {
  // Configuración general
  const configGeneralForm = document.getElementById('config-general-form');
  if (configGeneralForm) {
    configGeneralForm.addEventListener('submit', (e) => {
      e.preventDefault();
      mostrarAlerta('Configuración general guardada', 'success');
    });
  }
  
  // Configuración de seguridad
  const configSecurityForm = document.getElementById('config-security-form');
  if (configSecurityForm) {
    configSecurityForm.addEventListener('submit', (e) => {
      e.preventDefault();
      mostrarAlerta('Configuración de seguridad guardada', 'success');
    });
  }
}

// Cerrar modal
function cerrarModal() {
  document.querySelectorAll('.modal').forEach(modal => {
    modal.style.display = 'none';
  });
}

// ===============================
// UTILIDADES
// ===============================

// Formatear fecha
function formatearFecha(fecha) {
  if (!fecha) return 'Nunca';
  
  try {
    const date = new Date(fecha);
    return date.toLocaleString('es-MX', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    return fecha;
  }
}

// Mostrar alerta
function mostrarAlerta(mensaje, tipo = 'info') {
  const alerta = document.createElement('div');
  alerta.className = `alert alert-${tipo}`;
  alerta.innerHTML = `
    <span class="material-icons">${getAlertIcon(tipo)}</span>
    <span>${mensaje}</span>
    <button onclick="this.parentElement.remove()" class="alert-close">
      <span class="material-icons">close</span>
    </button>
  `;
  
  // Estilos
  alerta.style.cssText = `
    position: fixed;
    top: 100px;
    right: 20px;
    padding: 1rem 1.5rem;
    border-radius: 12px;
    color: white;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 12px;
    z-index: 1100;
    min-width: 300px;
    max-width: 500px;
    box-shadow: 0 10px 25px rgba(0,0,0,0.15);
    background: ${getAlertColor(tipo)};
    animation: slideIn 0.3s ease;
  `;
  
  document.body.appendChild(alerta);
  
  setTimeout(() => {
    if (alerta.parentElement) {
      alerta.remove();
    }
  }, 5000);
}

// Obtener icono de alerta
function getAlertIcon(tipo) {
  const icons = {
    'success': 'check_circle',
    'error': 'error',
    'warning': 'warning',
    'info': 'info'
  };
  return icons[tipo] || 'info';
}

// Obtener color de alerta
function getAlertColor(tipo) {
  const colors = {
    'success': '#059669',
    'error': '#dc2626',
    'warning': '#d97706',
    'info': '#0891b2'
  };
  return colors[tipo] || '#0891b2';
}

// Logout
function logout() {
  if (!confirm('¿Estás seguro de cerrar sesión?')) {
    return;
  }
  
  mostrarAlerta('Cerrando sesión...', 'info');
  
  setTimeout(() => {
    // Limpiar storage
    localStorage.removeItem('userSession');
    sessionStorage.removeItem('userSession');
    localStorage.removeItem('token');
    
    // Redireccionar
    window.location.href = 'login.html';
  }, 1000);
}

// Agregar estilos de animación
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  .loading::after {
    content: '';
    display: inline-block;
    width: 20px;
    height: 20px;
    border: 2px solid #ccc;
    border-radius: 50%;
    border-top-color: #007bff;
    animation: spin 1s ease-in-out infinite;
    margin-left: 10px;
  }
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;
document.head.appendChild(style);

console.log('✅ Admin.js funcional cargado completamente');