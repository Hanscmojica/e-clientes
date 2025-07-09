// ===== PERFIL.JS - VERSIÓN DE PRODUCCIÓN =====

// Configuración de la URL base de la API
const apiBase = 'https://e-clientes.rodall.com:5000';

// Variable global para datos del usuario
let userData = {};

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
  // Verificar sesión
  const token = localStorage.getItem('token');
  const userSessionLocal = localStorage.getItem('userSession');
  const userSessionSession = sessionStorage.getItem('userSession');
  
  const userSession = userSessionLocal || userSessionSession;
  
  if (!token || !userSession) {
    window.location.href = 'login.html';
    return;
  }
  
  try {
    // Parsear los datos de sesión
    const sessionData = JSON.parse(userSession);
    
    // Configurar userData con datos reales
    userData = {
      id: sessionData.id,
      nombre: sessionData.name ? sessionData.name.split(' ').slice(0, 2).join(' ') : 'Usuario',
      apellidos: sessionData.name ? sessionData.name.split(' ').slice(2).join(' ') : '',
      nombreCompleto: sessionData.name || 'Usuario',
      email: sessionData.email || 'no-email@domain.com',
      username: sessionData.username || 'usuario',
      role: sessionData.role || 'USER',
      idCliente: sessionData.idCliente || sessionData.id || 'N/A',
      telefono: sessionData.telefono || "+52 961 573 5235",
      direccion: sessionData.direccion || "Veracruz, Ver.",
      loginTime: sessionData.loginTime,
      lastPasswordChange: sessionData.lastPasswordChange,
      empresa: {
        nombre: sessionData.empresa || "Agencia Aduanal Rodall Oseguera",
        rfc: sessionData.rfc || "N/A",
        cargo: sessionData.role,
        direccion: sessionData.direccionEmpresa || "Av. Francisco I. Madero 33, Centro, 91700 Veracruz."
      }
    };
    
    configurarPagina();
    
  } catch (error) {
    console.error('Error al parsear sesión:', error);
    window.location.href = 'login.html';
    return;
  }
});

// Configurar página
function configurarPagina() {
  actualizarHeader();
  
  // Navegación
  const navItems = document.querySelectorAll('.nav-item');
  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const section = item.dataset.section;
      cambiarSeccion(section);
    });
  });

  configurarFormularios();
  cargarDatosUsuario();
  
  // Cerrar modales
  document.querySelectorAll('.close').forEach(closeBtn => {
    closeBtn.addEventListener('click', cerrarModal);
  });
  
  window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
      cerrarModal();
    }
  });
}

// Actualizar header
function actualizarHeader() {
  const userNameElement = document.querySelector('.user-name');
  if (userNameElement && userData.nombreCompleto) {
    userNameElement.textContent = userData.nombreCompleto;
  }
  
  const userFullName = document.getElementById('user-full-name');
  if (userFullName) {
    userFullName.textContent = userData.nombreCompleto;
  }
  
  const userRole = document.querySelector('.user-role');
  if (userRole) {
    userRole.textContent = formatearRol(userData.role);
  }
}

// Cambiar secciones
function cambiarSeccion(sectionName) {
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.remove('active');
  });
  const activeNavItem = document.querySelector(`[data-section="${sectionName}"]`);
  if (activeNavItem) activeNavItem.classList.add('active');
  
  document.querySelectorAll('.profile-section').forEach(section => {
    section.classList.remove('active');
  });
  const activeSection = document.getElementById(`${sectionName}-section`);
  if (activeSection) activeSection.classList.add('active');
}

// Configurar formularios
function configurarFormularios() {
  const passwordForm = document.getElementById('password-form');
  if (passwordForm) {
    passwordForm.addEventListener('submit', (e) => {
      e.preventDefault();
      cambiarContraseña();
    });
  }
  
  const preferencesForm = document.getElementById('preferences-form');
  if (preferencesForm) {
    preferencesForm.addEventListener('submit', (e) => {
      e.preventDefault();
      guardarPreferencias();
    });
  }
}

// Cargar datos del usuario
function cargarDatosUsuario() {
  // Información personal
  const userFullNameElement = document.getElementById('user-full-name');
  if (userFullNameElement) {
    userFullNameElement.textContent = userData.nombreCompleto;
  }
  
  const userRoleElement = document.querySelector('.user-role');
  if (userRoleElement) {
    userRoleElement.textContent = formatearRol(userData.role);
  }
  
  const userSinceElement = document.querySelector('.user-since');
  if (userSinceElement) {
    const fechaRegistro = userData.loginTime ? 
      new Date(userData.loginTime).toLocaleDateString('es-ES', { year: 'numeric', month: 'long' }) :
      'Marzo 2025';
    userSinceElement.textContent = `Usuario desde: ${fechaRegistro}`;
  }
  
  // Campos del formulario
  const nombreInput = document.getElementById('nombre');
  if (nombreInput) {
    nombreInput.value = userData.nombre || '';
  }
  
  const apellidosInput = document.getElementById('apellidos');
  if (apellidosInput) {
    apellidosInput.value = userData.apellidos || '';
  }
  
  const emailInput = document.getElementById('email');
  if (emailInput) {
    emailInput.value = userData.email || '';
  }
  
  const telefonoInput = document.getElementById('telefono');
  if (telefonoInput) {
    telefonoInput.value = userData.telefono || '';
  }
  
  const direccionInput = document.getElementById('direccion');
  if (direccionInput) {
    direccionInput.value = userData.direccion || '';
  }
  
  // Preferencias
  const itemsPorPagina = localStorage.getItem('itemsPorPagina');
  if (itemsPorPagina && document.getElementById('items-por-pagina')) {
    document.getElementById('items-por-pagina').value = itemsPorPagina;
  }

  // Ejecutar módulo de contraseñas
  setTimeout(() => {
    actualizarEstadoContrasena();
  }, 1000);
}

// Formatear rol
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

// Guardar preferencias
function guardarPreferencias() {
  const itemsPorPagina = document.getElementById('items-por-pagina')?.value;
  if (itemsPorPagina) {
    localStorage.setItem('itemsPorPagina', itemsPorPagina);
    mostrarAlerta('Preferencias guardadas correctamente', 'success');
  }
}

// Modales
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

// Cerrar sesión
function logout() {
  if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
    localStorage.removeItem('userSession');
    localStorage.removeItem('token');
    sessionStorage.removeItem('userSession');
    window.location.href = 'login.html';
  }
}

// Mostrar alertas
function mostrarAlerta(mensaje, tipo = 'info') {
  const alerta = document.createElement('div');
  alerta.className = `alert alert-${tipo}`;
  alerta.textContent = mensaje;
  
  alerta.style.position = 'fixed';
  alerta.style.top = '20px';
  alerta.style.right = '20px';
  alerta.style.padding = '15px 20px';
  alerta.style.borderRadius = '10px';
  alerta.style.color = 'white';
  alerta.style.zIndex = '1001';
  alerta.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
  
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
  
  setTimeout(() => {
    if (document.body.contains(alerta)) {
      document.body.removeChild(alerta);
    }
  }, 4000);
}

// Ver sesiones (placeholder)
function verSesiones() {
  mostrarAlerta('Función de sesiones activas en desarrollo');
}

// Cambiar avatar (placeholder)
function cambiarAvatar() {
  mostrarAlerta('Función de cambio de avatar en desarrollo');
}

// ===== MÓDULO DE EXPIRACIÓN DE CONTRASEÑAS =====

// Función principal para actualizar el estado de la contraseña
function actualizarEstadoContrasena() {
    const ultimaActualizacionElement = document.getElementById('ultima-actualizacion');
    const tarjetaSeguridad = document.querySelector('.seguridad-card');
    const passwordExpiryInfo = document.getElementById('password-expiry-info');
    const passwordStatusText = document.getElementById('password-status-text');

    const passwordExpirationDays = 180;
    
    // Buscar fecha de último cambio
    let lastPasswordChangeDate = null;
    
    if (userData.lastPasswordChange) {
        lastPasswordChangeDate = new Date(userData.lastPasswordChange);
    }
    else if (localStorage.getItem('lastPasswordChange')) {
        lastPasswordChangeDate = new Date(localStorage.getItem('lastPasswordChange'));
    }
    else {
        lastPasswordChangeDate = new Date(userData.loginTime);
        localStorage.setItem('lastPasswordChange', userData.loginTime);
    }

    const now = new Date();
    const diasDesdeCambio = Math.floor((now - lastPasswordChangeDate) / (1000 * 60 * 60 * 24));
    const diasRestantes = passwordExpirationDays - diasDesdeCambio;

    // Actualizar elementos
    if (ultimaActualizacionElement) {
        ultimaActualizacionElement.textContent = `hace ${diasDesdeCambio} días`;
    }

    if (passwordExpiryInfo) {
        if (diasRestantes <= 0) {
            passwordExpiryInfo.textContent = '🚨 Tu contraseña ha EXPIRADO';
            passwordExpiryInfo.style.color = '#dc2626';
            passwordExpiryInfo.style.fontWeight = 'bold';
        } else if (diasRestantes <= 10) {
            passwordExpiryInfo.textContent = `⚠️ Expira en ${diasRestantes} días`;
            passwordExpiryInfo.style.color = '#dc2626';
            passwordExpiryInfo.style.fontWeight = 'bold';
        } else {
            passwordExpiryInfo.textContent = `Expira en ${diasRestantes} días`;
            passwordExpiryInfo.style.color = '#666';
            passwordExpiryInfo.style.fontWeight = 'normal';
        }
    }

    if (passwordStatusText) {
        const estado = determinarEstadoTexto(diasDesdeCambio, diasRestantes);
        passwordStatusText.textContent = `Estado: ${estado}`;
    }

    // Aplicar colores a la tarjeta
    if (tarjetaSeguridad) {
        const colorInfo = determinarColorEstado(diasDesdeCambio, diasRestantes);
        
        // Aplicar estilos
        tarjetaSeguridad.style.border = `3px solid ${colorInfo.borderColor}`;
        tarjetaSeguridad.style.backgroundColor = colorInfo.backgroundColor;
        tarjetaSeguridad.style.borderRadius = '12px';
        tarjetaSeguridad.style.transition = 'all 0.3s ease';
        tarjetaSeguridad.style.boxShadow = `0 4px 12px ${colorInfo.borderColor}33`;
        
        // Mostrar alerta si es necesario
        if (colorInfo.mostrarAlerta) {
            mostrarAlerta(colorInfo.mensaje, colorInfo.tipoAlerta);
        }
    }

    return {
        diasDesdeCambio,
        diasRestantes,
        estado: determinarEstadoTexto(diasDesdeCambio, diasRestantes),
        fechaExpiracion: new Date(lastPasswordChangeDate.getTime() + (passwordExpirationDays * 24 * 60 * 60 * 1000))
    };
}

// Determinar color y estado
function determinarColorEstado(diasDesdeCambio, diasRestantes) {
    if (diasRestantes <= 0) {
        return {
            borderColor: '#dc2626',
            backgroundColor: '#fef2f2',
            mostrarAlerta: true,
            mensaje: '🚨 Tu contraseña ha EXPIRADO. Debes cambiarla inmediatamente.',
            tipoAlerta: 'error'
        };
    }
    
    if (diasRestantes <= 10) {
        return {
            borderColor: '#dc2626',
            backgroundColor: '#fef2f2',
            mostrarAlerta: true,
            mensaje: `🔴 ¡URGENTE! Tu contraseña expirará en ${diasRestantes} días. Cámbiala ahora.`,
            tipoAlerta: 'error'
        };
    }
    
    if (diasDesdeCambio >= 135) {
        return {
            borderColor: '#ea580c',
            backgroundColor: '#fff7ed',
            mostrarAlerta: false,
            mensaje: `🟠 Tu contraseña vence pronto (${diasRestantes} días restantes)`,
            tipoAlerta: 'warning'
        };
    }
    
    if (diasDesdeCambio >= 90) {
        return {
            borderColor: '#eab308',
            backgroundColor: '#fefce8',
            mostrarAlerta: false,
            mensaje: `🟡 Considera cambiar tu contraseña pronto (${diasRestantes} días restantes)`,
            tipoAlerta: 'info'
        };
    }
    
    if (diasDesdeCambio >= 45) {
        return {
            borderColor: '#22c55e',
            backgroundColor: '#f0fdf4',
            mostrarAlerta: false,
            mensaje: `🟢 Estado normal (${diasRestantes} días restantes)`,
            tipoAlerta: 'success'
        };
    }
    
    return {
        borderColor: '#16a34a',
        backgroundColor: '#f0fdf4',
        mostrarAlerta: false,
        mensaje: `🟢 Contraseña reciente (${diasRestantes} días restantes)`,
        tipoAlerta: 'success'
    };
}

// Determinar estado en texto
function determinarEstadoTexto(diasDesdeCambio, diasRestantes) {
    if (diasRestantes <= 0) return 'EXPIRADA';
    if (diasRestantes <= 10) return 'CRÍTICO';
    if (diasDesdeCambio >= 135) return 'NARANJA';
    if (diasDesdeCambio >= 90) return 'AMARILLO';
    if (diasDesdeCambio >= 45) return 'VERDE';
    return 'ÓPTIMO';
}

// Cambiar contraseña con actualización de fecha
async function cambiarContraseña() {
    const currentPassword = document.getElementById('current-password').value;
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;

    try {
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

        const token = localStorage.getItem('token');
        if (!token) {
            mostrarAlerta('No hay sesión activa. Por favor, inicie sesión nuevamente.', 'error');
            window.location.href = './login.html';
            return;
        }

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

        // Actualizar fecha de último cambio
        const fechaCambio = new Date().toISOString();
        userData.lastPasswordChange = fechaCambio;
        localStorage.setItem('lastPasswordChange', fechaCambio);
        
        // Actualizar sesión
        const userSession = localStorage.getItem('userSession') || sessionStorage.getItem('userSession');
        if (userSession) {
            try {
                const sessionData = JSON.parse(userSession);
                sessionData.lastPasswordChange = fechaCambio;
                localStorage.setItem('userSession', JSON.stringify(sessionData));
            } catch (e) {
                console.log('No se pudo actualizar sesión');
            }
        }

        // Re-ejecutar módulo
        actualizarEstadoContrasena();

        mostrarAlerta('Contraseña cambiada correctamente', 'success');
        cerrarModal();
        document.getElementById('password-form').reset();

    } catch (error) {
        console.error('Error al cambiar contraseña:', error);
        mostrarAlerta(error.message || 'Error al cambiar la contraseña. Intente nuevamente.', 'error');
    }
}