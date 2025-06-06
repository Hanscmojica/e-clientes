// Configuración de la API
const apiBase = 'http://10.11.20.14:5001';

// Variables globales
let usuarios = [];
let perfiles = [];
let currentSection = 'dashboard';
let editingUserId = null;
let permisosData = [];
let modulosDisponibles = [];  

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

  cargarLogs();
  
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
// DASHBOARD - CONECTADO CON API
// ===============================

// Cargar dashboard
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
    }
    
    // Cargar actividad reciente
    const activityResponse = await fetch(`${apiBase}/api/admin/recent-activity`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (activityResponse.ok) {
      const activityData = await activityResponse.json();
      actualizarActividadReciente(activityData.data);
    }
    
  } catch (error) {
    console.error('Error cargando dashboard:', error);
    mostrarDashboardFallback();
  }
}

// Actualizar actividad reciente
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

// Dashboard fallback
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

// Cargar usuarios desde la API
async function cargarUsuarios() {
  const tableBody = document.getElementById('usuarios-table-body');
  tableBody.innerHTML = '<tr><td colspan="7" class="loading">Cargando usuarios...</td></tr>';
  
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
    
    console.log('✅ Usuarios cargados desde API:', usuarios.length);
    mostrarUsuarios(usuarios);
    
  } catch (error) {
    console.error('❌ Error cargando usuarios:', error);
    tableBody.innerHTML = '<tr><td colspan="7" class="error">Error cargando usuarios: ' + error.message + '</td></tr>';
    mostrarAlerta('Error cargando usuarios: ' + error.message, 'error');
  }
}

// Mostrar usuarios en la tabla
function mostrarUsuarios(usuariosList) {
  const tableBody = document.getElementById('usuarios-table-body');
  
  if (usuariosList.length === 0) {
    tableBody.innerHTML = '<tr><td colspan="7" class="no-data">No se encontraron usuarios</td></tr>';
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
// ACCIONES DE USUARIOS - CON API REAL
// ===============================

// ✅ FUNCIÓN CORREGIDA: Editar usuario - Sin obligar re-selección de rol
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
  document.getElementById('nuevo-id-cliente').value = usuario.idCliente || '';
  document.getElementById('nuevo-activo').checked = usuario.active;
  
  // ✅ NUEVO: Pre-seleccionar el rol actual y hacer opcional
  const perfilSelect = document.getElementById('nuevo-perfil');
  perfilSelect.value = usuario.role;
  perfilSelect.required = false; // ✅ Quitar obligatoriedad en edición
  
  // ✅ NUEVO: Agregar opción "Mantener rol actual" como primera opción
  setTimeout(() => {
    const currentOption = perfilSelect.querySelector(`option[value="${usuario.role}"]`);
    if (currentOption) {
      currentOption.selected = true;
      currentOption.textContent = `${usuario.role} (Actual) - ${currentOption.textContent.split(' - ')[1] || ''}`;
    }
  }, 100);
  
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

// Toggle estado del usuario - CON API REAL
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
    
  } catch (error) {
    console.error('❌ Error cambiando estado:', error);
    mostrarAlerta('Error: ' + error.message, 'error');
  }
}

// Eliminar usuario - CON API REAL
async function eliminarUsuario(userId) {
  const usuario = usuarios.find(u => u.id === userId);
  if (!usuario) {
    mostrarAlerta('Usuario no encontrado', 'error');
    return;
  }
  
  if (!confirm(`¿Estás seguro de eliminar al usuario ${usuario.username}?\\n\\nEsta acción no se puede deshacer.`)) {
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
    
  } catch (error) {
    console.error('❌ Error eliminando usuario:', error);
    mostrarAlerta('Error: ' + error.message, 'error');
  }
}

// ===============================
// MODAL REAL CON FORMULARIO
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
  
  // Configurar tabs del modal
  configurarTabsModal();
}

// Configurar tabs del modal
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

// ✅ FUNCIÓN CORREGIDA: Mostrar modal - Diferenciar creación vs edición
function mostrarModalCrearUsuario() {
  const modal = document.getElementById('modal-crear-usuario');
  
  // Cargar perfiles disponibles
  cargarPerfilesEnSelect();
  
  // ✅ NUEVO: Si no es edición, configurar para creación
  if (!editingUserId) {
    document.getElementById('form-crear-usuario').reset();
    document.getElementById('nuevo-usuario').disabled = false;
    
    // ✅ En modo creación, el perfil ES obligatorio
    const perfilSelect = document.getElementById('nuevo-perfil');
    perfilSelect.required = true;
    
    const passwordField = document.getElementById('nuevo-password');
    if (passwordField) {
      passwordField.required = true;
      passwordField.placeholder = '';
    }
    
    // Restaurar título y botón para creación
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

// Cargar perfiles en el select
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
    console.error('Error cargando perfiles:', error);
    // Fallback
    select.innerHTML = `
      <option value="">Seleccionar perfil...</option>
      <option value="CLIENTE">CLIENTE - Cliente del sistema</option>
      <option value="ADMINISTRADOR">ADMINISTRADOR - Administrador del sistema</option>
      <option value="ADMIN">ADMIN - Administrador con acceso total</option>
    `;
  }
}

// Configurar formularios
function configurarFormularios() {
  const formCrearUsuario = document.getElementById('form-crear-usuario');
  
  if (formCrearUsuario) {
    formCrearUsuario.addEventListener('submit', manejarSubmitUsuario);
  }
}

// ✅ FUNCIÓN CORREGIDA: Validación diferenciada para creación vs edición
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
  
  // ✅ VALIDACIONES DIFERENCIADAS
  if (!formData.nombre || !formData.apellidoPaterno || !formData.username || !formData.email) {
    mostrarAlerta('Todos los campos obligatorios deben ser completados', 'error');
    return;
  }
  
  // ✅ NUEVO: Password solo obligatorio en creación
  if (!editingUserId && !formData.password) {
    mostrarAlerta('La contraseña es requerida para usuarios nuevos', 'error');
    return;
  }
  
  // ✅ NUEVO: Perfil solo obligatorio en creación
  if (!editingUserId && !formData.perfil) {
    mostrarAlerta('Debe seleccionar un perfil para usuarios nuevos', 'error');
    return;
  }
  
  // ✅ NUEVO: En edición, si no se selecciona perfil, mantener el actual
  if (editingUserId && !formData.perfil) {
    const usuarioActual = usuarios.find(u => u.id === editingUserId);
    if (usuarioActual) {
      formData.perfil = usuarioActual.role;
      console.log(`📝 Manteniendo rol actual: ${formData.perfil}`);
    }
  }
  
  if (!formData.idCliente) {
    mostrarAlerta('El ID Cliente es requerido para vincular con las referencias', 'error');
    return;
  }
  
  try {
    const token = getAuthToken();
    let response;
    
    console.log('📤 Enviando datos al backend:', formData);
    
    if (editingUserId) {
      console.log(`🔄 Actualizando usuario ID: ${editingUserId}`);
      response = await fetch(`${apiBase}/api/admin/usuarios/${editingUserId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
    } else {
      console.log('➕ Creando nuevo usuario');
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
    console.log('✅ Respuesta completa del servidor:', result);
    
    mostrarAlerta(result.message || `Usuario ${editingUserId ? 'actualizado' : 'creado'} exitosamente`, 'success');
    
    // Cerrar modal
    cerrarModal();
    
    // Recargar usuarios
    await cargarUsuarios();
    
  } catch (error) {
    console.error(`❌ Error ${editingUserId ? 'actualizando' : 'creando'} usuario:`, error);
    mostrarAlerta('Error: ' + error.message, 'error');
  }
}

// ✅ FUNCIÓN CORREGIDA: Cerrar modal - Limpiar estado
function cerrarModal() {
  console.log('🚪 Cerrando modal...');
  
  // Cerrar modal de crear usuario específicamente
  const modalCrearUsuario = document.getElementById('modal-crear-usuario');
  if (modalCrearUsuario) {
    modalCrearUsuario.style.display = 'none';
    console.log('✅ Modal crear usuario cerrado');
  }
  
  // Cerrar cualquier modal con clase .modal
  document.querySelectorAll('.modal').forEach(modal => {
    modal.style.display = 'none';
  });
  
  // ✅ NUEVO: Limpiar estado de edición
  editingUserId = null;
  
  // ✅ NUEVO: Resetear formulario y restaurar configuración para creación
  const form = document.getElementById('form-crear-usuario');
  if (form) {
    form.reset();
    
    // Restaurar configuración para próxima creación
    document.getElementById('nuevo-usuario').disabled = false;
    
    const perfilSelect = document.getElementById('nuevo-perfil');
    if (perfilSelect) {
      perfilSelect.required = true; // Volver a hacer obligatorio para creación
    }
    
    const passwordField = document.getElementById('nuevo-password');
    if (passwordField) {
      passwordField.required = true;
      passwordField.placeholder = '';
    }
    
    console.log('✅ Formulario reseteado y configurado para creación');
  }
  
  console.log('✅ Modal cerrado completamente');
}

// ===============================
// GESTIÓN DE PERFILES - CON API
// ===============================

// Cargar perfiles
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
    
  } catch (error) {
    console.error('❌ Error cargando perfiles:', error);
    mostrarPerfilesFallback();
  }
}

// Mostrar perfiles
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

// Perfiles fallback
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

// Placeholder functions
function mostrarModalCrearPermiso() {
  mostrarAlerta('Modal de crear permiso en desarrollo', 'info');
}

function filtrarLogs() {
    const startDate = document.getElementById('log-date-start').value;
    const endDate = document.getElementById('log-date-end').value;
    const type = document.getElementById('log-type').value;
    
    console.log('🔍 Filtrando logs:', { startDate, endDate, type });
    
    // Cargar logs con filtros
    cargarLogs(1, 100, startDate, endDate, type);
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

// Función para cargar logs desde el API
// ✅ FUNCIÓN CORREGIDA: Cargar logs desde el API
async function cargarLogs(page = 1, limit = 100, startDate = null, endDate = null, type = null) {
  try {
      const token = getAuthToken();
      
      // ✅ CORREGIDO: Usar apiBase para la URL completa
      let url = `${apiBase}/api/admin/logs?page=${page}&limit=${limit}`;
      
      if (startDate) url += `&startDate=${startDate}`;
      if (endDate) url += `&endDate=${endDate}`;
      if (type && type !== '' && type !== 'todos') url += `&type=${type}`;

      console.log('🔍 Cargando logs desde:', url);

      const response = await fetch(url, {
          method: 'GET',
          headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
          }
      });

      const result = await response.json();

      if (result.success) {
          mostrarLogs(result.data.logs);
          actualizarPaginacion(result.data);
          console.log(`✅ ${result.data.logs.length} logs cargados exitosamente`);
      } else {
          mostrarAlerta('Error cargando logs: ' + result.message, 'error');
      }

  } catch (error) {
      console.error('❌ Error cargando logs:', error);
      mostrarAlerta('Error de conexión al cargar logs', 'error');
  }
}

// ✅ FUNCIÓN MEJORADA: Mostrar logs con más información
function mostrarLogs(logs) {
  const container = document.getElementById('logs-table');
  
  if (!logs || logs.length === 0) {
      container.innerHTML = `
          <div class="no-data">
              <span class="material-icons">info</span>
              <p>No se encontraron logs para los filtros seleccionados</p>
          </div>
      `;
      return;
  }

  let html = `
      <div class="table-responsive">
          <table class="admin-table">
              <thead>
                  <tr>
                      <th>Fecha/Hora</th>
                      <th>Usuario</th>
                      <th>Tipo</th>
                      <th>Estado</th>
                      <th>Descripción</th>
                      <th>IP</th>
                      <th>Dispositivo</th>
                  </tr>
              </thead>
              <tbody>
  `;

  logs.forEach(log => {
      const fecha = formatearFecha(log.timestamp);
      const successIcon = log.success !== false ? 'check_circle' : 'error';
      const successClass = log.success !== false ? 'success' : 'danger';
      
      html += `
          <tr>
              <td>${fecha}</td>
              <td>
                  <div class="user-info">
                      <span class="material-icons">person</span>
                      ${log.username || 'Sistema'}
                  </div>
              </td>
              <td>
                  <span class="badge badge-${getBadgeClass(log.type)}">${log.type}</span>
              </td>
              <td>
                  <span class="status-badge ${successClass}">
                      <span class="material-icons">${successIcon}</span>
                      ${log.success !== false ? 'Exitoso' : 'Fallido'}
                  </span>
              </td>
              <td>${log.description}</td>
              <td>${log.ipAddress || '-'}</td>
              <td>
                  <span class="device-info">
                      <span class="material-icons">${getDeviceIcon(log.device)}</span>
                      ${log.device || 'Unknown'}
                  </span>
              </td>
          </tr>
      `;
  });

  html += `
              </tbody>
          </table>
      </div>
  `;

  container.innerHTML = html;
}

// ✅ FUNCIÓN MEJORADA: Obtener clase CSS del badge según el tipo de log
function getBadgeClass(type) {
  switch(type) {
      case 'LOGIN': return 'success';
      case 'LOGOUT': return 'info';
      case 'LOGIN_FAILED': return 'danger';
      case 'FIRST_LOGIN': return 'warning';
      case 'PASSWORD_CHANGED': return 'primary';
      case 'USER_CREATED': return 'success';
      case 'USER_UPDATED': return 'warning';
      case 'USER_DELETED': return 'danger';
      case 'USER_STATUS_CHANGED': return 'info';
      case 'REFERENCIAS_BUSQUEDA': return 'secondary';
      default: return 'secondary';
  }
}

// ✅ NUEVA FUNCIÓN: Obtener icono de dispositivo
function getDeviceIcon(device) {
  if (!device) return 'device_unknown';
  const deviceLower = device.toLowerCase();
  if (deviceLower.includes('mobile')) return 'smartphone';
  if (deviceLower.includes('tablet')) return 'tablet';
  if (deviceLower.includes('desktop')) return 'computer';
  return 'device_unknown';
}

// ✅ FUNCIÓN MEJORADA: Actualizar controles de paginación
function actualizarPaginacion(data) {
  const paginationContainer = document.querySelector('#logs-section .pagination') || createPaginationContainer();
  
  console.log(`📊 Logs: ${data.logs.length} de ${data.totalLogs} total (Página ${data.currentPage} de ${data.totalPages})`);
  
  if (data.totalPages <= 1) {
      paginationContainer.innerHTML = `
          <div class="pagination-info">
              <span>${data.totalLogs} logs encontrados</span>
          </div>
      `;
      return;
  }
  
  let paginationHTML = '<div class="pagination-controls">';
  
  // Botón anterior
  if (data.hasPrevPage) {
      paginationHTML += `<button class="btn-pagination" onclick="cargarLogs(${data.currentPage - 1})">
          <span class="material-icons">chevron_left</span> Anterior
      </button>`;
  }
  
  // Información de página
  paginationHTML += `<span class="pagination-info">
      Página ${data.currentPage} de ${data.totalPages} (${data.totalLogs} logs total)
  </span>`;
  
  // Botón siguiente
  if (data.hasNextPage) {
      paginationHTML += `<button class="btn-pagination" onclick="cargarLogs(${data.currentPage + 1})">
          Siguiente <span class="material-icons">chevron_right</span>
      </button>`;
  }
  
  paginationHTML += '</div>';
  paginationContainer.innerHTML = paginationHTML;
}

// ✅ NUEVA FUNCIÓN: Crear contenedor de paginación si no existe
function createPaginationContainer() {
  const logsSection = document.getElementById('logs-section');
  let container = logsSection.querySelector('.pagination');
  if (!container) {
      container = document.createElement('div');
      container.className = 'pagination';
      logsSection.appendChild(container);
  }
  return container;
}

// Mostrar alerta (mantén tu función actual)
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

// Obtener icono de alerta (mantén tu función actual)
function getAlertIcon(tipo) {
const icons = {
  'success': 'check_circle',
  'error': 'error',
  'warning': 'warning',
  'info': 'info'
};
return icons[tipo] || 'info';
}

// Obtener color de alerta (mantén tu función actual)
function getAlertColor(tipo) {
const colors = {
  'success': '#059669',
  'error': '#dc2626',
  'warning': '#d97706',
  'info': '#2563eb'
};
return colors[tipo] || '#2563eb';
}

// Logout
function logout() {
  if (!confirm('¿Estás seguro de cerrar sesión?')) {
    return;
  }
  
  mostrarAlerta('Cerrando sesión...', 'info');
  
  setTimeout(() => {
    localStorage.removeItem('userSession');
    sessionStorage.removeItem('userSession');
    localStorage.removeItem('token');
    window.location.href = 'login.html';
  }, 1000);
}

// Mostrar modal para crear perfil
function mostrarModalCrearPerfil() {
  const modal = document.createElement('div');
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h3>Crear Nuevo Perfil</h3>
        <button class="close-modal" onclick="cerrarModal()">&times;</button>
      </div>
      <div class="modal-body">
        <form id="form-crear-perfil">
          <div class="form-group">
            <label>Nombre del Perfil:</label>
            <input type="text" id="perfil-nombre" required placeholder="Ej: Editor de Contenido">
          </div>
          <div class="form-group">
            <label>Descripción:</label>
            <textarea id="perfil-descripcion" rows="3" placeholder="Descripción del perfil y sus responsabilidades"></textarea>
          </div>
          <div class="form-group">
            <label>
              <input type="checkbox" id="perfil-activo" checked>
              Perfil activo
            </label>
          </div>
        </form>
      </div>
      <div class="modal-footer">
        <button class="btn-secondary" onclick="cerrarModal()">Cancelar</button>
        <button class="btn-primary" onclick="crearPerfil()">Crear Perfil</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
}

// Crear nuevo perfil
async function crearPerfil() {
  const nombre = document.getElementById('perfil-nombre').value.trim();
  const descripcion = document.getElementById('perfil-descripcion').value.trim();
  const activo = document.getElementById('perfil-activo').checked;

  if (!nombre) {
    mostrarAlerta('El nombre del perfil es obligatorio', 'error');
    return;
  }

  try {
    const token = getAuthToken();
    const response = await fetch(`${apiBase}/api/admin/perfiles`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        nombre,
        descripcion,
        activo
      })
    });

    const result = await response.json();

    if (result.success) {
      mostrarAlerta('Perfil creado exitosamente', 'success');
      cerrarModal();
      cargarPerfiles(); // Recargar la lista
    } else {
      mostrarAlerta('Error: ' + result.message, 'error');
    }

  } catch (error) {
    console.error('❌ Error creando perfil:', error);
    mostrarAlerta('Error de conexión al crear perfil', 'error');
  }
}

// Editar perfil
async function editarPerfil(perfilId) {
  try {
    // Buscar el perfil en la lista actual
    const perfil = perfiles.find(p => p.id === perfilId);
    if (!perfil) {
      mostrarAlerta('Perfil no encontrado', 'error');
      return;
    }

    const modal = document.createElement('div');
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h3>Editar Perfil</h3>
          <button class="close-modal" onclick="cerrarModal()">&times;</button>
        </div>
        <div class="modal-body">
          <form id="form-editar-perfil">
            <div class="form-group">
              <label>Nombre del Perfil:</label>
              <input type="text" id="edit-perfil-nombre" value="${perfil.nombre}" required>
            </div>
            <div class="form-group">
              <label>Descripción:</label>
              <textarea id="edit-perfil-descripcion" rows="3">${perfil.descripcion}</textarea>
            </div>
            <div class="form-group">
              <label>
                <input type="checkbox" id="edit-perfil-activo" ${perfil.activo ? 'checked' : ''}>
                Perfil activo
              </label>
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" onclick="cerrarModal()">Cancelar</button>
          <button class="btn-primary" onclick="actualizarPerfil(${perfilId})">Guardar Cambios</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);

  } catch (error) {
    console.error('❌ Error abriendo modal de edición:', error);
    mostrarAlerta('Error al abrir editor de perfil', 'error');
  }
}

// Actualizar perfil
async function actualizarPerfil(perfilId) {
  const nombre = document.getElementById('edit-perfil-nombre').value.trim();
  const descripcion = document.getElementById('edit-perfil-descripcion').value.trim();
  const activo = document.getElementById('edit-perfil-activo').checked;

  if (!nombre) {
    mostrarAlerta('El nombre del perfil es obligatorio', 'error');
    return;
  }

  try {
    const token = getAuthToken();
    const response = await fetch(`${apiBase}/api/admin/perfiles/${perfilId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        nombre,
        descripcion,
        activo
      })
    });

    const result = await response.json();

    if (result.success) {
      mostrarAlerta('Perfil actualizado exitosamente', 'success');
      cerrarModal();
      cargarPerfiles(); // Recargar la lista
    } else {
      mostrarAlerta('Error: ' + result.message, 'error');
    }

  } catch (error) {
    console.error('❌ Error actualizando perfil:', error);
    mostrarAlerta('Error de conexión al actualizar perfil', 'error');
  }
}

console.log('✅ Admin.js con backend real cargado completamente');

// ✅ FUNCIÓN PARA TOGGLE PASSWORD EN ADMIN
function toggleAdminPassword(inputId, button) {
  console.log('¡Click funcionó!', inputId);
  const passwordInput = document.getElementById(inputId);
  const toggleIcon = button.querySelector('.material-icons');
  
  if (passwordInput && toggleIcon) {
    if (passwordInput.type === 'password') {
      passwordInput.type = 'text';
      toggleIcon.textContent = 'visibility_off';
    } else {
      passwordInput.type = 'password';
      toggleIcon.textContent = 'visibility';
    }
  }
}