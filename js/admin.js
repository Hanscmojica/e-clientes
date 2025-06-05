// SISTEMA DE LOGGING SEGURO
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

// ===============================
// CONFIGURACIÓN Y VARIABLES
// ===============================
const apiBase = 'http://10.11.21.15:5001';
let usuarios = [];
let perfiles = [];
let currentSection = 'dashboard';
let editingUserId = null;

// ===============================
// INICIALIZACIÓN
// ===============================
document.addEventListener('DOMContentLoaded', function() {
  logger.debug('Cargando panel de administrador...');
  
  // Verificación simple - solo comprobar si hay sesión
  const userSession = JSON.parse(localStorage.getItem('userSession') || sessionStorage.getItem('userSession') || 'null');
  
  if (!userSession) {
    logger.warn('No hay sesión, redirigiendo...');
    window.location.href = 'login.html';
    return;
  }
  
  logger.auth('Sesión encontrada', userSession);
  
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
  
  logger.info('Panel admin cargado exitosamente');
});

// ===============================
// FUNCIONES DE UTILIDAD
// ===============================
function getAuthToken() {
  const userSession = JSON.parse(localStorage.getItem('userSession') || sessionStorage.getItem('userSession') || 'null');
  return userSession ? userSession.token : null;
}

// ===============================
// NAVEGACIÓN
// ===============================
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
      mostrarAlerta('Sección en desarrollo', 'info');
      break;
    case 'logs':
      mostrarAlerta('Sección en desarrollo', 'info');
      break;
    case 'configuracion':
      mostrarAlerta('Configuración cargada', 'success');
      break;
  }
}

// ===============================
// DASHBOARD - CONECTADO CON API
// ===============================
async function cargarDashboard() {
  try {
    const token = getAuthToken();
    
    // Cargar estadísticas reales
    const statsResponse = await fetch(`${apiBase}/api/admin/stats`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (statsResponse.ok) {
      const statsData = await statsResponse.json();
      const stats = statsData.data;
      
      // Actualizar con animación
      setTimeout(() => document.getElementById('total-usuarios').textContent = stats.totalUsuarios, 100);
      setTimeout(() => document.getElementById('usuarios-activos').textContent = stats.usuariosActivos, 200);
      setTimeout(() => document.getElementById('logins-hoy').textContent = stats.loginsHoy, 300);
      setTimeout(() => document.getElementById('referencias-mes').textContent = stats.referenciasMes, 400);
      
      logger.debug('Estadísticas del dashboard cargadas', stats);
    }
    
    // Cargar actividad reciente
    const activityResponse = await fetch(`${apiBase}/api/admin/recent-activity`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (activityResponse.ok) {
      const activityData = await activityResponse.json();
      actualizarActividadReciente(activityData.data);
      logger.debug('Actividad reciente cargada');
    }
    
  } catch (error) {
    logger.error('Error cargando dashboard', error);
    mostrarDashboardFallback();
  }
}

function actualizarActividadReciente(activity) {
  const activityList = document.getElementById('activity-list');
  
  if (!activity || activity.length === 0) {
    activityList.innerHTML = '<div class="activity-item"><span class="material-icons">info</span><span>No hay actividad reciente</span></div>';
    return;
  }
  
  activityList.innerHTML = activity.map(item => `
    <div class="activity-item">
      <span class="material-icons">${getActivityIcon(item.type)}</span>
      <span>${item.description} - ${formatearFecha(item.timestamp)}</span>
    </div>
  `).join('');
}

function mostrarDashboardFallback() {
  document.getElementById('total-usuarios').textContent = '0';
  document.getElementById('usuarios-activos').textContent = '0';
  document.getElementById('logins-hoy').textContent = '0';
  document.getElementById('referencias-mes').textContent = '0';
  
  const activityList = document.getElementById('activity-list');
  activityList.innerHTML = `
    <div class="activity-item">
      <span class="material-icons">error</span>
      <span>Error conectando con el servidor</span>
    </div>
  `;
}

function getActivityIcon(type) {
  const icons = {
    'LOGIN': 'login',
    'LOGOUT': 'logout',
    'USER_CREATED': 'person_add',
    'USER_UPDATED': 'edit',
    'USER_DELETED': 'person_remove',
    'USER_ACCESSED': 'assignment'
  };
  return icons[type] || 'info';
}

// ===============================
// GESTIÓN DE USUARIOS - CON API REAL
// ===============================
async function cargarUsuarios() {
  const tableBody = document.getElementById('usuarios-table-body');
  tableBody.innerHTML = '<tr><td colspan="9" class="loading">Cargando usuarios...</td></tr>';
 // ← AGREGAR ESTA LÍNEA
  
  try {
    const token = getAuthToken();
    const response = await fetch(`${apiBase}/api/admin/usuarios`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    usuarios = data.data;

    console.log('✅ TODOS LOS USUARIOS:', usuarios);
    console.log('🔍 PRIMER USUARIO COMPLETO:', usuarios[0]);
    console.log('🎯 ID CLIENTE DEL PRIMERO:', usuarios[0]?.idCliente)
    
    logger.info('Usuarios cargados desde API', { count: usuarios.length });
    mostrarUsuarios(usuarios);
    
  } catch (error) {
    logger.error('Error cargando usuarios', error);
    tableBody.innerHTML = '<tr><td colspan="9" class="error">Error cargando usuarios: ' + error.message + '</td></tr>';
    mostrarAlerta('Error cargando usuarios: ' + error.message, 'error');
  }
}

function mostrarUsuarios(usuariosList) {

  console.log('🚀 mostrarUsuarios() EJECUTÁNDOSE con:', usuariosList.length, 'usuarios');
  console.log('📋 Primer usuario para mostrar:', usuariosList[0]);

  const tableBody = document.getElementById('usuarios-table-body');

  console.log('🎯 tableBody encontrado:', tableBody);
  
  if (usuariosList.length === 0) {
    tableBody.innerHTML = '<tr><td colspan="9" class="no-data">No se encontraron usuarios</td></tr>';
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
      <td>
        <div class="user-cell">
          <div class="user-avatar">
            <span class="material-icons">person</span>
          </div>
          <strong>${usuario.idCliente}</strong>
        </div>
      </td>
    </tr>
  `).join('');

  console.log('📝 HTML generado para primer usuario:', htmlGenerado.substring(0, 200) + '...');
  
  tableBody.innerHTML = htmlGenerado;
  
  console.log('✅ HTML insertado en la tabla');

}
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
// ACCIONES DE USUARIOS - CON API REAL
// ===============================
// ✅ FUNCIÓN CORREGIDA: Editar usuario
function editarUsuario(userId) {
  const usuario = usuarios.find(u => u.id === userId);
  if (!usuario) {
    mostrarAlerta('Usuario no encontrado', 'error');
    return;
  }
  
  editingUserId = userId;
  
  // Pre-llenar el formulario con los datos del usuario
  const nombreCompleto = usuario.name.split(' ');
  document.getElementById('nuevo-nombre').value = nombreCompleto[0] || '';
  document.getElementById('nuevo-apellido-paterno').value = nombreCompleto[1] || '';
  document.getElementById('nuevo-apellido-materno').value = nombreCompleto.slice(2).join(' ') || '';
  document.getElementById('nuevo-usuario').value = usuario.username;
  document.getElementById('nuevo-email').value = usuario.email;
  
  // ✅ CORREGIDO: Ahora usar el campo idCliente separado
  document.getElementById('nuevo-id-cliente').value = usuario.idCliente || '';
  
  document.getElementById('nuevo-perfil').value = usuario.role;
  document.getElementById('nuevo-activo').checked = usuario.active;
  
  // Cambiar el título y botón del modal
  const modalTitle = document.querySelector('#modal-crear-usuario h2');
  const submitBtn = document.querySelector('#form-crear-usuario button[type="submit"]');
  
  if (modalTitle) {
    modalTitle.innerHTML = '<span class="material-icons">edit</span> Editar Usuario';
  }
  
  if (submitBtn) {
    submitBtn.innerHTML = '<span class="material-icons">save</span> Actualizar Usuario';
  }
  
  // Deshabilitar campo de username y password para edición
  document.getElementById('nuevo-usuario').disabled = true;
  const passwordField = document.getElementById('nuevo-password');
  if (passwordField) {
    passwordField.required = false;
    passwordField.placeholder = 'Dejar en blanco para mantener actual';
  }
  
  mostrarModalCrearUsuario();
}

async function toggleUsuarioStatus(userId) {
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
  
  try {
    const token = getAuthToken();
    const response = await fetch(`${apiBase}/api/admin/usuarios/${userId}/toggle-status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ active: nuevoEstado })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Error al cambiar estado');
    }
    
    // Actualizar en la lista local
    usuario.active = nuevoEstado;
    mostrarUsuarios(usuarios);
    mostrarAlerta(`Usuario ${accion}do exitosamente`, 'success');
    logger.info(`Usuario ${accion}do`, { id: userId, username: usuario.username });
    
  } catch (error) {
    logger.error('Error cambiando estado', error);
    mostrarAlerta('Error: ' + error.message, 'error');
  }
}

async function eliminarUsuario(userId) {
  const usuario = usuarios.find(u => u.id === userId);
  if (!usuario) {
    mostrarAlerta('Usuario no encontrado', 'error');
    return;
  }
  
  if (!confirm(`¿Estás seguro de eliminar al usuario ${usuario.username}?\n\nEsta acción no se puede deshacer.`)) {
    return;
  }
  
  try {
    const token = getAuthToken();
    const response = await fetch(`${apiBase}/api/admin/usuarios/${userId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Error al eliminar usuario');
    }
    
    // Remover de la lista local
    usuarios = usuarios.filter(u => u.id !== userId);
    mostrarUsuarios(usuarios);
    mostrarAlerta('Usuario eliminado exitosamente', 'success');
    logger.info('Usuario eliminado', { id: userId, username: usuario.username });
    
  } catch (error) {
    logger.error('Error eliminando usuario', error);
    mostrarAlerta('Error: ' + error.message, 'error');
  }
}

// ===============================
// MODAL REAL CON FORMULARIO
// ===============================
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
  
  // Configurar tabs del modal
  configurarTabsModal();
}

function configurarTabsModal() {
  const tabButtons = document.querySelectorAll('.tab-btn');
  
  tabButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const tabName = btn.dataset.tab;
      
      // Actualizar botones
      tabButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      // Mostrar contenido correspondiente
      document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
      });
      document.getElementById(`tab-${tabName}`).classList.add('active');
    });
  });
}

function mostrarModalCrearUsuario() {
  const modal = document.getElementById('modal-crear-usuario');
  
  // Cargar perfiles disponibles
  cargarPerfilesEnSelect();
  
  // Si no es edición, limpiar formulario
  if (!editingUserId) {
    document.getElementById('form-crear-usuario').reset();
    document.getElementById('nuevo-usuario').disabled = false;
    const passwordField = document.getElementById('nuevo-password');
    if (passwordField) {
      passwordField.required = true;
      passwordField.placeholder = '';
    }
    
    // Restaurar título y botón
    const modalTitle = document.querySelector('#modal-crear-usuario h2');
    const submitBtn = document.querySelector('#form-crear-usuario button[type="submit"]');
    
    if (modalTitle) {
      modalTitle.innerHTML = '<span class="material-icons">person_add</span> Crear Nuevo Usuario';
    }
    
    if (submitBtn) {
      submitBtn.innerHTML = '<span class="material-icons">save</span> Crear Usuario';
    }
  }
  
  // Mostrar primera tab
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
  document.querySelector('.tab-btn[data-tab="basic"]').classList.add('active');
  document.getElementById('tab-basic').classList.add('active');
  
  modal.style.display = 'block';
}

async function cargarPerfilesEnSelect() {
  const select = document.getElementById('nuevo-perfil');
  
  try {
    const token = getAuthToken();
    const response = await fetch(`${apiBase}/api/admin/perfiles`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (response.ok) {
      const data = await response.json();
      perfiles = data.data;
      
      select.innerHTML = '<option value="">Seleccionar perfil...</option>' +
        perfiles.map(perfil => 
          `<option value="${perfil.nombre}">${perfil.nombre} - ${perfil.descripcion}</option>`
        ).join('');
      
      logger.debug('Perfiles cargados en select', { count: perfiles.length });
    } else {
      // Fallback con perfiles básicos
      select.innerHTML = `
        <option value="">Seleccionar perfil...</option>
        <option value="CLIENTE">CLIENTE - Cliente del sistema</option>
        <option value="ADMINISTRADOR">ADMINISTRADOR - Administrador del sistema</option>
        <option value="ADMIN">ADMIN - Administrador con acceso total</option>
      `;
    }
  } catch (error) {
    logger.error('Error cargando perfiles', error);
    // Fallback
    select.innerHTML = `
      <option value="">Seleccionar perfil...</option>
      <option value="CLIENTE">CLIENTE - Cliente del sistema</option>
      <option value="ADMINISTRADOR">ADMINISTRADOR - Administrador del sistema</option>
      <option value="ADMIN">ADMIN - Administrador con acceso total</option>
    `;
  }
}

function configurarFormularios() {
  const formCrearUsuario = document.getElementById('form-crear-usuario');
  
  if (formCrearUsuario) {
    formCrearUsuario.addEventListener('submit', manejarSubmitUsuario);
  }
}

async function manejarSubmitUsuario(e) {
  e.preventDefault();
  
  const formData = {
    nombre: document.getElementById('nuevo-nombre').value.trim(),
    apellidoPaterno: document.getElementById('nuevo-apellido-paterno').value.trim(),
    apellidoMaterno: document.getElementById('nuevo-apellido-materno').value.trim(),
    username: document.getElementById('nuevo-usuario').value.trim(),
    email: document.getElementById('nuevo-email').value.trim(),
    idCliente: parseInt(document.getElementById('nuevo-id-cliente').value) || null,
    perfil: document.getElementById('nuevo-perfil').value,
    activo: document.getElementById('nuevo-activo').checked
  };
  
  // Solo incluir password si es creación o si se proporcionó
  const passwordField = document.getElementById('nuevo-password');
  if (passwordField && (passwordField.value || !editingUserId)) {
    formData.password = passwordField.value;
  }
  
  // Validaciones básicas
  if (!formData.nombre || !formData.apellidoPaterno || !formData.username || !formData.email) {
    mostrarAlerta('Todos los campos obligatorios deben ser completados', 'error');
    return;
  }
  
  if (!editingUserId && !formData.password) {
    mostrarAlerta('La contraseña es requerida para usuarios nuevos', 'error');
    return;
  }
  
  if (!formData.perfil) {
    mostrarAlerta('Debe seleccionar un perfil', 'error');
    return;
  }
  
  if (!formData.idCliente) {
    mostrarAlerta('El ID Cliente es requerido para vincular con las referencias', 'error');
    return;
  }
  
  try {
    const token = getAuthToken();
    let response;
    
    logger.debug('Enviando datos al backend', { 
      operation: editingUserId ? 'UPDATE' : 'CREATE',
      userId: editingUserId,
      username: formData.username
    });
    
    if (editingUserId) {
      response = await fetch(`${apiBase}/api/admin/usuarios/${editingUserId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
    } else {
      response = await fetch(`${apiBase}/api/admin/usuarios`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
    }
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Error en la operación');
    }
    
    const result = await response.json();
    logger.info(`Usuario ${editingUserId ? 'actualizado' : 'creado'} exitosamente`, {
      userId: editingUserId || 'nuevo',
      username: formData.username
    });
    
    mostrarAlerta(result.message || `Usuario ${editingUserId ? 'actualizado' : 'creado'} exitosamente`, 'success');
    
    // Cerrar modal
    cerrarModal();
    
    // Recargar usuarios
    await cargarUsuarios();
    
    // Forzar actualización de la tabla
    mostrarUsuarios(usuarios);
    
  } catch (error) {
    logger.error(`Error ${editingUserId ? 'actualizando' : 'creando'} usuario`, error);
    mostrarAlerta('Error: ' + error.message, 'error');
  }
}

function cerrarModal() {
  document.querySelectorAll('.modal').forEach(modal => {
    modal.style.display = 'none';
  });
  
  // Limpiar estado de edición
  editingUserId = null;
  
  // Resetear formulario
  const form = document.getElementById('form-crear-usuario');
  if (form) {
    form.reset();
    document.getElementById('nuevo-usuario').disabled = false;
    const passwordField = document.getElementById('nuevo-password');
    if (passwordField) {
      passwordField.required = true;
      passwordField.placeholder = '';
    }
  }
}

// ===============================
// GESTIÓN DE PERFILES - CON API
// ===============================
async function cargarPerfiles() {
  const profilesGrid = document.getElementById('profiles-grid');
  profilesGrid.innerHTML = '<div class="profile-card loading"><div class="profile-header"><span class="material-icons">badge</span><h3>Cargando perfiles...</h3></div></div>';
  
  try {
    const token = getAuthToken();
    const response = await fetch(`${apiBase}/api/admin/perfiles`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!response.ok) {
      throw new Error('Error cargando perfiles');
    }
    
    const data = await response.json();
    perfiles = data.data;
    
    mostrarPerfiles(perfiles);
    logger.info('Perfiles cargados', { count: perfiles.length });
    
  } catch (error) {
    logger.error('Error cargando perfiles', error);
    mostrarPerfilesFallback();
  }
}

function mostrarPerfiles(perfilesList) {
  const profilesGrid = document.getElementById('profiles-grid');
  
  profilesGrid.innerHTML = perfilesList.map(perfil => `
    <div class="profile-card">
      <div class="profile-header">
        <span class="material-icons">badge</span>
        <h3>${perfil.nombre}</h3>
      </div>
      <div class="profile-body">
        <p>${perfil.descripcion}</p>
        <div class="profile-stats">
          <div class="stat">
            <span class="stat-number">${perfil.usuarios}</span>
            <span class="stat-label">Usuarios</span>
          </div>
          <div class="stat">
            <span class="stat-number">${perfil.activo ? 'Activo' : 'Inactivo'}</span>
            <span class="stat-label">Estado</span>
          </div>
        </div>
      </div>
      <div class="profile-actions">
        <button class="btn-icon" onclick="editarPerfil(${perfil.id})" title="Editar">
          <span class="material-icons">edit</span>
        </button>
      </div>
    </div>
  `).join('');
}

function mostrarPerfilesFallback() {
  const profilesGrid = document.getElementById('profiles-grid');
  
  profilesGrid.innerHTML = `
    <div class="profile-card">
      <div class="profile-header">
        <span class="material-icons">error</span>
        <h3>Error de Conexión</h3>
      </div>
      <div class="profile-body">
        <p>No se pudieron cargar los perfiles desde el servidor</p>
      </div>
    </div>
  `;
}

function editarPerfil(perfilId) {
  mostrarAlerta('Funcionalidad de edición de perfiles en desarrollo', 'info');
}

// ===============================
// UTILIDADES
// ===============================
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

function getAlertIcon(tipo) {
  const icons = {
    'success': 'check_circle',
    'error': 'error',
    'warning': 'warning',
    'info': 'info'
  };
  return icons[tipo] || 'info';
}

function getAlertColor(tipo) {
  const colors = {
    'success': '#059669',
    'error': '#dc2626',
    'warning': '#d97706',
    'info': '#0891b2'  
  };
  return colors[tipo] || '#0891b2';
}

function logout() {
  if (!confirm('¿Estás seguro de cerrar sesión?')) {
    return;
  }
  
  mostrarAlerta('Cerrando sesión...', 'info');
  logger.info('Usuario cerrando sesión');
  
  setTimeout(() => {
    localStorage.removeItem('userSession');
    sessionStorage.removeItem('userSession');
    localStorage.removeItem('token');
    window.location.href = 'login.html';
  }, 1000);
}

// ===============================
// ESTILOS DE ANIMACIÓN
// ===============================
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
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
  
  .error {
    color: #dc2626;
    text-align: center;
    font-style: italic;
  }
`;
document.head.appendChild(style);

logger.info('Admin.js con sistema de logging seguro cargado completamente');