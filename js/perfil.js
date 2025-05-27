// Configuración de la URL base de la API
const apiBase = `${window.location.protocol}//${window.location.hostname}:5001`;

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
    }
  };
  
  // Inicialización SIMPLE - SIN VERIFICACIONES COMPLEJAS
  document.addEventListener('DOMContentLoaded', function() {
    console.log('Cargando perfil...');
    
    // Solo verificar que haya token - SIMPLE
    const token = localStorage.getItem('token');
    const userSession = localStorage.getItem('userSession');
    
    if (!token || !userSession) {
        window.location.href = 'login.html';
        return;
    }
    
    console.log('✅ Token encontrado, cargando perfil');
    
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
    
    // Cargar datos del usuario
    cargarDatosUsuario();
  });
  
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
      window.location.href = './login.html';
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
      if (document.body.contains(alerta)) {
        document.body.removeChild(alerta);
      }
    }, 3000);
  }