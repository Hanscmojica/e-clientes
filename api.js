// Verificar autenticación al cargar la página
document.addEventListener('DOMContentLoaded', function() {
    // Verificar si existe sesión
    const userSession = JSON.parse(localStorage.getItem('userSession') || sessionStorage.getItem('userSession') || 'null');
    
    // Si no hay sesión, redirigir al login
    if (!userSession) {
        window.location.href = 'login.html';
        return;
    }
    
    // Verificar si el token ha expirado
    const loginTime = new Date(userSession.loginTime);
    const currentTime = new Date();
    const hoursSinceLogin = (currentTime - loginTime) / (1000 * 60 * 60);
    
    if (hoursSinceLogin > 8) {
        // Si han pasado más de 8 horas, cerrar sesión
        logout();
        return;
    }
    
    // Si llegamos aquí, la sesión es válida
    console.log('%c✅ Usuario autenticado', 'color: green; font-weight: bold; font-size: 14px');
    console.log('ID Cliente:', userSession.id);
    console.log('Nombre:', userSession.name);
    console.log('Rol:', userSession.role);
    
    // Actualizar el nombre de usuario y ID en la interfaz
    const userNameElement = document.querySelector('.user-name');
    const userIdElement = document.querySelector('.user-id');
    if (userNameElement) {
        userNameElement.textContent = userSession.name;
    }
    if (userIdElement) {
        userIdElement.textContent = `(ID: ${userSession.id})`;
    }

     // Mostrar enlace de admin si es administrador
    if  (userSession.role === 'ADMIN' || userSession.role === 'ADMINISTRADOR') {
          const adminLink = document.getElementById('admin-link');
          if (adminLink) adminLink.style.display = 'block';
   }
 
    // Configurar el botón de cerrar sesión
    const logoutBtn = document.querySelector('.logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
});

// Función para verificar el token de autenticación (para el botón)
function checkAuthToken() {
    const authStatus = document.getElementById('authStatus');
    const userSession = JSON.parse(localStorage.getItem('userSession') || sessionStorage.getItem('userSession') || 'null');
    
    if (userSession && userSession.token) {
        authStatus.textContent = `Autenticado como: ${userSession.name} (ID: ${userSession.id}) - ${userSession.role}`;
        authStatus.style.backgroundColor = '#e6ffe6';
        authStatus.style.border = '1px solid #4CAF50';
        authStatus.style.color = '#2e7d32';
    } else {
        authStatus.textContent = 'No autenticado. Token no encontrado.';
        authStatus.style.backgroundColor = '#ffebee';
        authStatus.style.border = '1px solid #f44336';
        authStatus.style.color = '#c62828';
    }
    
    authStatus.style.display = 'block';
    console.log('Datos de sesión completos:', userSession);
}

// Función global para cerrar sesión
function logout() {
    // Eliminar datos de sesión
    localStorage.removeItem('userSession');
    sessionStorage.removeItem('userSession');
    localStorage.removeItem('token');
    
    // Redirigir a login.html
    window.location.href = 'login.html';
}

// Arreglo global para almacenar las referencias
let referencias = [];
let referenciasCompletas = [];
let referenciasFiltradas = [];
function getItemsPorPagina() {
    return parseInt(localStorage.getItem('itemsPorPagina')) || 10;
}
let paginaActual = 1;

// Obtener el modal
const modal = document.getElementById('historialModal');
const span = document.getElementsByClassName('close')[0];

// Cuando el usuario hace clic en la X, cerrar el modal
if (span) {
    span.onclick = function() {
        if (modal) modal.style.display = "none";
    }
}

// Cuando el usuario hace clic fuera del modal, cerrarlo
window.onclick = function(event) {
    if (event.target == modal) {
        if (modal) modal.style.display = "none";
    }
}

// Manejar las pestañas del modal
document.addEventListener('click', function(e) {
    const button = e.target.closest('.tab-button');
    if (button && modal && modal.contains(button)) {
        const tabName = button.dataset.tab;

        modal.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
        modal.querySelectorAll('.tab-panel').forEach(panel => panel.classList.remove('active'));

        button.classList.add('active');
        const tabPanel = modal.querySelector(`#${tabName}-tab`);
        if (tabPanel) {
            tabPanel.classList.add('active');
        } else {
            console.warn(`No se encontró el panel de pestaña: #${tabName}-tab`);
        }
        
        if (tabName === "biblioteca") {
            const referenciaIndex = parseInt(modal.dataset.referenciaIndex || "0");
            if (referenciasCompletas[referenciaIndex]) {
                generarBibliotecaModal(referenciasCompletas[referenciaIndex]);
            }
        }
    }
});

// Función para filtrar referencias por búsqueda
function filtrarReferencias() {
    const searchTerm = document.getElementById('searchReferencia').value.toLowerCase();

    if (searchTerm.trim() === '') {
        referenciasFiltradas = [...referencias];
    } else {
        referenciasFiltradas = referencias.filter(ref =>
            ref.Referencia && ref.Referencia.toLowerCase().includes(searchTerm)
        );
    }
    actualizarContadorBusqueda();
    paginaActual = 1;
    mostrarReferencias(getCurrentClienteInfo(), referenciasFiltradas);
}

// Función para actualizar el contador de búsqueda
function actualizarContadorBusqueda() {
    const searchCount = document.getElementById('searchCount');
    if (searchCount) {
        const total = referencias.length;
        const filtradas = referenciasFiltradas.length;
        if (document.getElementById('searchReferencia').value.trim() !== '') {
            searchCount.textContent = `${filtradas} de ${total}`;
        } else {
            searchCount.textContent = '';
        }
    }
}

// Función para obtener la información actual del cliente
function getCurrentClienteInfo() {
    const userSession = JSON.parse(localStorage.getItem('userSession') || 'null');
    return referencias.length > 0 ? {
        id: userSession ? userSession.id : 'N/A',
        nombre: referencias[0].Cliente || '',
        importador: referencias[0].Importador || '',
        aduana: referencias[0].Aduana || ''
    } : { id: userSession ? userSession.id : 'N/A' };
}

// Función para limpiar el formulario
function limpiarFormulario() {
    document.getElementById('tipoFecha').value = '1';
    document.getElementById('fechaInicial').value = '';
    document.getElementById('fechaFinal').value = '';
    document.getElementById('referencias-container').innerHTML = '';
    const alertEl = document.getElementById('alert');
    if (alertEl) alertEl.style.display = 'none';

    const searchContainer = document.getElementById('search-filter-container');
    if (searchContainer) searchContainer.style.display = 'none';
    const searchInput = document.getElementById('searchReferencia');
    if (searchInput) searchInput.value = '';

    referencias = [];
    referenciasCompletas = [];
    referenciasFiltradas = [];
    paginaActual = 1;
}

// Función principal para consultar referencias - MODIFICADA PARA USAR ID AUTOMÁTICO
function consultarReferencias() {
    const fechaInicial = document.getElementById('fechaInicial').value;
    const fechaFinal = document.getElementById('fechaFinal').value;

    // Obtener el ID del usuario logueado automáticamente
    const userSession = JSON.parse(localStorage.getItem('userSession') || sessionStorage.getItem('userSession') || 'null');
    
    if (!userSession || !userSession.id) {
        mostrarAlerta('No hay sesión activa. Por favor, inicie sesión nuevamente.', 'error');
        setTimeout(() => {
            logout();
        }, 2000);
        return;
    }

    const clienteNo = userSession.id; // USAR EL ID DEL USUARIO AUTOMÁTICAMENTE

    if (!fechaInicial || !fechaFinal) {
        mostrarAlerta('Por favor, complete las fechas.', 'error');
        return;
    }

    console.log(`🔍 Consultando referencias para cliente ID: ${clienteNo}`);

    document.getElementById('loading').style.display = 'flex';
    const alertEl = document.getElementById('alert');
    if (alertEl) alertEl.style.display = 'none';
    document.getElementById('referencias-container').innerHTML = '';

    const datos = {
        ClienteNo: parseInt(clienteNo), // Usar el ID del usuario logueado
        TipoFecha: parseInt(document.getElementById('tipoFecha').value),
        FechaInicial: fechaInicial,
        FechaFinal: fechaFinal
    };

    if (!userSession.token) {
        mostrarAlerta('Token de sesión no encontrado. Por favor, inicie sesión nuevamente.', 'error');
        document.getElementById('loading').style.display = 'none';
        setTimeout(() => {
            logout();
        }, 2000);
        return;
    }

    axios.post('http://localhost:5001/api/v1/apiExterna', datos, {
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${userSession.token}`
        }
    })
    .then(res => {
        document.getElementById('loading').style.display = 'none';
        procesarRespuesta(res.data);
    })
    .catch(err => {
        console.error('Error en la solicitud:', err);
        document.getElementById('loading').style.display = 'none';
        
        if (err.response && err.response.status === 401) {
            mostrarAlerta('Sesión expirada o inválida. Por favor, inicie sesión nuevamente.', 'error');
            setTimeout(() => {
                logout();
            }, 2000);
        } else {
            mostrarAlerta('Error al llamar a la API: ' + (err.response?.data?.message || err.message), 'error');
        }
    });
}

// Función para mostrar alertas
function mostrarAlerta(mensaje, tipo = 'error') {
    const alertEl = document.getElementById('alert');
    if (!alertEl) return;
    alertEl.textContent = mensaje;
    alertEl.className = `alert ${tipo}`;
    alertEl.style.display = 'block';
    setTimeout(() => {
        alertEl.style.display = 'none';
    }, 5000);
}

// Función para procesar la respuesta de la API
function procesarRespuesta(data) {
    if (!data || Object.keys(data).length === 0) {
        mostrarAlerta('No se encontraron referencias para este cliente.', 'error');
        return;
    }
    try {
        referencias = [];
        referenciasCompletas = [];
        referenciasFiltradas = [];
        paginaActual = 1;
        const searchInput = document.getElementById('searchReferencia');
        if (searchInput) searchInput.value = '';

        if (data.status === "OK" && data.data && data.data.SDTRef) {
            referenciasCompletas = JSON.parse(JSON.stringify(data.data.SDTRef));
            referencias = data.data.SDTRef.map(ref => {
                const refPlana = {...ref};
                delete refPlana.Hist;
                if (ref.Hist && ref.Hist.length > 0) {
                    const ultimoHistorial = ref.Hist[0];
                    refPlana.UltimoEstado = ultimoHistorial.Estado;
                    refPlana.UltimaFecha = formatearFecha(ultimoHistorial.Fecha);
                    refPlana.UltimaCausa = ultimoHistorial.Causa;
                }
                return refPlana;
            });
            referenciasFiltradas = [...referencias];
            const searchContainer = document.getElementById('search-filter-container');
            if (searchContainer) searchContainer.style.display = 'block';
            mostrarReferencias(getCurrentClienteInfo(), referencias);
        } else if (data.status && data.status !== "OK") {
            mostrarAlerta(data.message || 'Error en la consulta.', 'error');
        } else {
            mostrarAlerta('La respuesta no tiene el formato esperado.', 'error');
        }
    } catch (error) {
        console.error('Error al procesar la respuesta:', error);
        mostrarAlerta('Error al procesar los datos: ' + error.message, 'error');
    }
}

// Función para formatear fechas
function formatearFecha(fechaStr) {
    if (!fechaStr) return '';
    try {
        if (String(fechaStr).match(/^\d{2}\/\d{2}\/\d{4}$/)) return fechaStr;
        const fecha = new Date(fechaStr);
        if (isNaN(fecha.getTime())) return fechaStr;
        return fecha.toLocaleDateString('es-MX', {
            year: 'numeric', month: '2-digit', day: '2-digit'
        });
    } catch (e) {
        return fechaStr;
    }
}

// ✅ FUNCIÓN CORREGIDA - Generarar biblioteca de documentos DENTRO DEL MODAL
function generarBibliotecaModal(referenciaOriginal) {
    const listaDocumentosUI = modal.querySelector('#listaDocumentos');
    const noDocumentosMensaje = modal.querySelector('#noDocumentosModalMensaje');

    if (!listaDocumentosUI || !noDocumentosMensaje) {
        console.error("Elementos de la biblioteca no encontrados en el modal.");
        return;
    }
    
    listaDocumentosUI.innerHTML = '<li style="text-align:center; padding:20px;">Cargando documentos...</li>';
    noDocumentosMensaje.style.display = 'none';
    
    const numeroReferencia = referenciaOriginal.Referencia || '';
    
    console.log(`Generando biblioteca para referencia: ${numeroReferencia}`);
    
    if (!numeroReferencia) {
        noDocumentosMensaje.style.display = 'block';
        noDocumentosMensaje.textContent = 'No se pudo identificar la referencia';
        listaDocumentosUI.innerHTML = '';
        return;
    }

    const BACKEND_URL = 'http://localhost:5001';
    // ✅ URL CORREGIDA - Cambio de /list/ a /api/referencias/.../documentos
    const endpointUrl = `${BACKEND_URL}/api/referencias/${numeroReferencia}/documentos`;
    
    console.log(`Consultando endpoint: ${endpointUrl}`);
    
    fetch(endpointUrl)
        .then(response => {
            console.log(`Respuesta del servidor: status=${response.status}`);
            if (!response.ok) {
                throw new Error(`Error del servidor: ${response.status} ${response.statusText}`);
            }
            return response.json();
        })
        .then(respuestaAPI => {
            // ✅ MANEJO DE RESPUESTA CORREGIDO - Ahora maneja la nueva estructura JSON
            console.log(`Respuesta completa del API:`, respuestaAPI);
            
            listaDocumentosUI.innerHTML = '';

            // Verificar si la respuesta es exitosa
            if (!respuestaAPI.success) {
                noDocumentosMensaje.style.display = 'block';
                noDocumentosMensaje.textContent = respuestaAPI.data?.message || 'Error al consultar documentos';
                listaDocumentosUI.style.display = 'none';
                return;
            }

            const data = respuestaAPI.data;
            
            // Verificar si hay documentos
            if (!data.hasDocuments || !data.documents || data.documents.length === 0) {
                noDocumentosMensaje.style.display = 'block';
                noDocumentosMensaje.textContent = data.message || 'No hay documentos disponibles para esta referencia.';
                listaDocumentosUI.style.display = 'none';
                return;
            }

            noDocumentosMensaje.style.display = 'none';
            listaDocumentosUI.style.display = '';

            // ✅ PROCESAR LOS DOCUMENTOS - Ahora accede a data.documents
            data.documents.forEach((doc, index) => {
                const li = document.createElement('li');
                
                const nombreArchivo = doc.title || doc.nombre || doc.filename || `Documento ${index + 1}`;
                const tamanioArchivo = doc.size || '';
                
                let iconName = 'description';
                
                if (nombreArchivo.toLowerCase().includes('factura')) iconName = 'receipt';
                else if (nombreArchivo.toLowerCase().includes('bl') || nombreArchivo.toLowerCase().includes('lading')) iconName = 'article';
                else if (nombreArchivo.toLowerCase().includes('cove')) iconName = 'receipt_long';
                else if (nombreArchivo.toLowerCase().includes('.xml')) iconName = 'code';
                else if (nombreArchivo.toLowerCase().includes('.xlsx') || nombreArchivo.toLowerCase().includes('.xls')) iconName = 'assessment';
                else if (nombreArchivo.toLowerCase().includes('pedimento')) iconName = 'assignment';
                
                const safeFilename = doc.filename || doc.title || doc.nombre || nombreArchivo;
                const escapedFilename = encodeURIComponent(safeFilename);
                
                li.innerHTML = `
                    <span class="material-icons">${iconName}</span>
                    <span class="document-name">${nombreArchivo} ${tamanioArchivo ? '(' + tamanioArchivo + ')' : ''}</span>
                    <div class="document-actions">
                        <a href="#" class="btn-accion-doc download" title="Descargar" onclick="event.stopPropagation(); descargarDocumentoModal('${numeroReferencia}', '${escapedFilename}')">
                            <span class="material-icons">download</span> Descargar
                        </a>
                        <a href="#" class="btn-accion-doc view" title="Ver" onclick="event.stopPropagation(); verDocumentoModal('${numeroReferencia}', '${escapedFilename}'); return false;">
                            <span class="material-icons">visibility</span> Ver
                        </a>
                    </div>
                `;
                listaDocumentosUI.appendChild(li);
            });
            
            const filtroDocsInput = modal.querySelector('#filtroDocumentosModal');
            if (filtroDocsInput) {
                filtroDocsInput.addEventListener('input', filtrarDocumentosModal);
                filtroDocsInput.value = '';
            }

            console.log(`✅ Se cargaron ${data.documents.length} documentos exitosamente`);
        })
        .catch(error => {
            console.error("Error al cargar documentos:", error);
            listaDocumentosUI.innerHTML = '';
            noDocumentosMensaje.style.display = 'block';
            noDocumentosMensaje.textContent = 'Error al cargar los documentos: ' + error.message;
        });
}

// ✅ FUNCIONES DE DESCARGA Y VISTA ACTUALIZADAS - Usando las nuevas URLs
// Función para ver documento (desde el modal)
function verDocumentoModal(referenciaId, docNombre) {
    const BACKEND_URL = 'http://localhost:5001';
    // 🔧 Actualizar URL según tu backend - ajustar si es necesario
    const viewUrl = `${BACKEND_URL}/view/${referenciaId}/${docNombre}`;
    
    console.log('Abriendo vista previa:', viewUrl);
    mostrarAlerta(`Abriendo vista previa de ${decodeURIComponent(docNombre)}...`, 'success');
    
    window.open(viewUrl, '_blank');
}

// Función para descargar documento (desde el modal)
function descargarDocumentoModal(referenciaId, docNombre) {
    const BACKEND_URL = 'http://localhost:5001';
    // 🔧 Actualizar URL según tu backend - ajustar si es necesario
    const downloadUrl = `${BACKEND_URL}/download/${referenciaId}/${docNombre}`;
    
    console.log('Descargando documento:', downloadUrl);
    mostrarAlerta(`Iniciando descarga de ${decodeURIComponent(docNombre)}...`, 'success');
    
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = decodeURIComponent(docNombre);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Función para filtrar documentos DENTRO DEL MODAL
function filtrarDocumentosModal() {
    const input = modal.querySelector('#filtroDocumentosModal');
    if (!input) return;

    const filter = input.value.toUpperCase();
    const ul = modal.querySelector('#listaDocumentos');
    if (!ul) return;

    const liItems = ul.getElementsByTagName('li');
    let count = 0;
    const noDocumentosMensaje = modal.querySelector('#noDocumentosModalMensaje');

    for (let i = 0; i < liItems.length; i++) {
        const docNameSpan = liItems[i].querySelector('.document-name');
        if (docNameSpan) {
            const txtValue = docNameSpan.textContent || docNameSpan.innerText;
            if (txtValue.toUpperCase().indexOf(filter) > -1) {
                liItems[i].style.display = "";
                count++;
            } else {
                liItems[i].style.display = "none";
            }
        }
    }

    if (noDocumentosMensaje) {
        if (count === 0 && liItems.length > 0) {
            noDocumentosMensaje.textContent = "No se encontraron documentos que coincidan.";
            noDocumentosMensaje.style.display = 'block';
        } else if (ul.children.length === 0 || (count === 0 && filter === '')) {
             noDocumentosMensaje.textContent = "No hay documentos disponibles para esta referencia.";
             noDocumentosMensaje.style.display = 'block';
        }
        else {
            noDocumentosMensaje.style.display = 'none';
        }
    }
}

// Función principal para mostrar el modal de una referencia con todas sus pestañas
function mostrarModalReferencia(indexEnListaMostrada) {
    const referenciaOriginal = referenciasCompletas[indexEnListaMostrada];

    if (!referenciaOriginal) {
        mostrarAlerta('No se encontró la referencia completa.', 'error');
        return;
    }

    if (modal) {
        modal.dataset.referenciaIndex = indexEnListaMostrada;
    }

    const modalTitulo = modal.querySelector('#refHistorialTitulo');
    if (modalTitulo) modalTitulo.textContent = `Referencia: ${referenciaOriginal.Referencia || 'N/A'}`;

    // Pestaña "Detalle"
    const detalleContenidoDiv = modal.querySelector('#detalleReferenciaContenido');
    if (detalleContenidoDiv) {
        detalleContenidoDiv.innerHTML = `
            <p><strong>Referencia:</strong> ${referenciaOriginal.Referencia || '-'}</p>
            <p><strong>Ref. Cliente:</strong> ${referenciaOriginal.ReferenciaCliente || '-'}</p>
            <p><strong>Estado:</strong> ${referenciaOriginal.Estado || getEstadoDescripcion(referenciaOriginal.EstadoCve) || '-'}</p>
            <p><strong>Fecha:</strong> ${formatearFecha(referenciaOriginal.Fecha) || '-'}</p>
            <p><strong>ETA:</strong> ${formatearFecha(referenciaOriginal.ETA) || '-'}</p>
            <p><strong>Mercancía:</strong> ${referenciaOriginal.Mercancia || '-'}</p>
            <p><strong>Contenedor:</strong> ${referenciaOriginal.Contenedor || '-'}</p>
            <p><strong>Buque:</strong> ${referenciaOriginal.Buque || '-'}</p>
            <p><strong>Reconocimiento:</strong> ${referenciaOriginal.TipoReconocimiento || '-'}</p>
            `;
    }

    // Pestaña "Biblioteca"
    generarBibliotecaModal(referenciaOriginal);

    // Pestaña "Historial"
    const historialDiv = modal.querySelector('#historialContenido');
    if (historialDiv) {
        historialDiv.innerHTML = '';
        if (!referenciaOriginal.Hist || referenciaOriginal.Hist.length === 0) {
            historialDiv.innerHTML = '<p style="text-align:center; padding:10px; color:var(--light-text);">No hay registros en el historial.</p>';
        } else {
            const historialOrdenado = [...referenciaOriginal.Hist].sort((a, b) => new Date(b.Fecha) - new Date(a.Fecha));
            historialOrdenado.forEach(item => {
                const itemDiv = document.createElement('div');
                itemDiv.className = `historial-item estado-${(item.Estado || '').toLowerCase()}`;
                itemDiv.innerHTML = `
                    <p><strong>Estado:</strong> ${item.Estado || '-'} (${getEstadoDescripcion(item.Estado)})</p>
                    <p><strong>Fecha:</strong> ${formatearFecha(item.Fecha) || '-'}</p>
                    <p><strong>Causa:</strong> ${item.Causa || '-'}</p>
                    <p><strong>Observaciones:</strong> ${item.Observaciones || '-'}</p>
                    <p><strong>Usuario:</strong> ${item.Usuario || '-'}</p>`;
                historialDiv.appendChild(itemDiv);
            });
        }
    }

    // Establecer "Detalle" como pestaña activa por defecto
    modal.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
    modal.querySelectorAll('.tab-panel').forEach(panel => panel.classList.remove('active'));

    const detalleButton = modal.querySelector('[data-tab="detalle"]');
    const detallePanel = modal.querySelector('#detalle-tab');
    if (detalleButton && detallePanel) {
        detalleButton.classList.add('active');
        detallePanel.classList.add('active');
    } else {
        const firstButton = modal.querySelector('.tab-button');
        if (firstButton) {
            firstButton.classList.add('active');
            const firstPanelId = firstButton.dataset.tab + '-tab';
            const firstPanel = modal.querySelector(`#${firstPanelId}`);
            if (firstPanel) firstPanel.classList.add('active');
        }
    }
    
    const filtroDocsInput = modal.querySelector('#filtroDocumentosModal');
    if (filtroDocsInput) filtroDocsInput.value = '';
    filtrarDocumentosModal();

    if (modal) modal.style.display = "block";
}

// Función para obtener la descripción de un estado
function getEstadoDescripcion(estadoCve) {
    const estados = {
        'P': 'Pendiente', 'C': 'En Proceso', 'D': 'Despacho', 'T': 'Terminado',
    };
    return estados[String(estadoCve).toUpperCase()] || estadoCve || 'Desconocido';
}

// Función para mostrar las referencias en formato de tarjetas - MODIFICADA
function mostrarReferencias(clienteInfo, referenciasAMostrarParam) {
    const container = document.getElementById('referencias-container');
    let referenciasAMostrar = referenciasAMostrarParam;

    if (!referenciasAMostrar) {
        referenciasAMostrar = referenciasFiltradas.length > 0 || (document.getElementById('searchReferencia')?.value) ? referenciasFiltradas : referencias;
    }
    container.innerHTML = '';

    const clienteDiv = document.createElement('div');
    clienteDiv.className = 'cliente-info';
    clienteDiv.innerHTML = `
        <h2>Información del Cliente</h2>
        <div class="cliente-details">
            <div class="cliente-detail-item"><strong>Cliente ID:</strong><span>${clienteInfo.id}</span></div>
            ${clienteInfo.nombre ? `<div class="cliente-detail-item"><strong>Nombre:</strong><span>${clienteInfo.nombre}</span></div>` : ''}
            ${clienteInfo.importador ? `<div class="cliente-detail-item"><strong>Importador:</strong><span>${clienteInfo.importador}</span></div>` : ''}
            ${clienteInfo.aduana ? `<div class="cliente-detail-item"><strong>Aduana:</strong><span>${clienteInfo.aduana}</span></div>` : ''}
            <div class="cliente-detail-item"><strong>Periodo:</strong><span>${formatearFecha(document.getElementById('fechaInicial').value)} - ${formatearFecha(document.getElementById('fechaFinal').value)}</span></div>
        </div>`;
    container.appendChild(clienteDiv);

    if (referenciasAMostrar.length === 0) {
        const noDataDiv = document.createElement('div');
        noDataDiv.style.cssText = 'padding: 40px; text-align: center; color: var(--light-text); font-size: 18px;';
        noDataDiv.textContent = document.getElementById('searchReferencia')?.value ? 'No se encontraron referencias con ese criterio.' : 'No se encontraron referencias para este cliente.';
        container.appendChild(noDataDiv);
        return;
    }

    const gridContainer = document.createElement('div');
    gridContainer.className = 'referencias-grid';
    const totalPaginas = Math.ceil(referenciasAMostrar.length / getItemsPorPagina());
    const inicio = (paginaActual - 1) * getItemsPorPagina();
    const fin = Math.min(inicio + getItemsPorPagina(), referenciasAMostrar.length);

    for (let i = inicio; i < fin; i++) {
        const refActualEnLista = referenciasAMostrar[i];
        const indiceEnCompletas = referenciasCompletas.findIndex(rc => rc.Referencia === refActualEnLista.Referencia);
        const card = crearTarjetaReferencia(refActualEnLista, indiceEnCompletas, i);
        gridContainer.appendChild(card);
    }
    container.appendChild(gridContainer);

    const resultsInfo = document.createElement('div');
    resultsInfo.className = 'results-info';
    resultsInfo.textContent = `Mostrando ${inicio + 1} - ${fin} de ${referenciasAMostrar.length} referencias`;
    container.appendChild(resultsInfo);

    if (totalPaginas > 1) {
        const paginacion = document.createElement('div');
        paginacion.className = 'pagination';
        const btnAnterior = document.createElement('button');
        btnAnterior.innerHTML = '<span class="material-icons">chevron_left</span> Anterior';
        btnAnterior.disabled = paginaActual === 1;
        btnAnterior.onclick = () => { if (paginaActual > 1) { paginaActual--; mostrarReferencias(clienteInfo, referenciasAMostrar); } };
        const btnSiguiente = document.createElement('button');
        btnSiguiente.innerHTML = 'Siguiente <span class="material-icons">chevron_right</span>';
        btnSiguiente.disabled = paginaActual === totalPaginas;
        btnSiguiente.onclick = () => { if (paginaActual < totalPaginas) { paginaActual++; mostrarReferencias(clienteInfo, referenciasAMostrar); } };
        const infoPagina = document.createElement('span');
        infoPagina.textContent = `Página ${paginaActual} de ${totalPaginas}`;
        paginacion.append(btnAnterior, infoPagina, btnSiguiente);
        container.appendChild(paginacion);
    }
}

// Función para crear una tarjeta de referencia
function crearTarjetaReferencia(referencia, indexOriginal, indexEnVistaActual) {
    const card = document.createElement('div');
    card.className = 'reference-card';
    const estadoCve = referencia.EstadoCve || referencia.UltimoEstado || '';
    const estadoTexto = referencia.Estado || getEstadoDescripcion(estadoCve);
    const estadoClass = obtenerClaseEstado(estadoCve);

    card.innerHTML = `
        <div class="ref-header">
            <a href="#" class="ref-number" onclick="mostrarModalReferencia(${indexOriginal}); return false;">
                ${referencia.Referencia || 'Sin referencia'}
            </a>
        </div>
        <div class="ref-status ${estadoClass}">Estado: ${estadoTexto}</div>
        <div class="ref-details">
            ${referencia.ReferenciaCliente ? `<div class="ref-detail-item"><strong>Ref. Cliente:</strong><span>${referencia.ReferenciaCliente}</span></div>` : ''}
            ${referencia.Contenedor ? `<div class="ref-detail-item"><strong>Contenedor:</strong><span>${referencia.Contenedor}</span></div>` : ''}
            <div class="ref-detail-item"><strong>Fecha:</strong><span>${formatearFecha(referencia.Fecha) || '-'}</span></div>
            ${referencia.ETA ? `<div class="ref-detail-item"><strong>ETA:</strong><span>${formatearFecha(referencia.ETA)}</span></div>` : ''}
            ${referencia.Mercancia ? `<div class="ref-detail-item"><strong>Mercancía:</strong><span>${referencia.Mercancia}</span></div>` : ''}
            ${referencia.Buque ? `<div class="ref-detail-item"><strong>Buque:</strong><span>${referencia.Buque}</span></div>` : ''}
            ${referencia.TipoReconocimiento ? `<div class="ref-detail-item"><strong>Reconocimiento:</strong><span>${referencia.TipoReconocimiento}</span></div>` : ''}
        </div>
        <div class="ref-actions">
            <button class="btn-action btn-pdf" onclick="event.stopPropagation(); console.log('PDF para ref: ${referencia.Referencia}')">
                <span class="material-icons">picture_as_pdf</span> PDF
            </button>
            <button class="btn-action btn-preview" onclick="event.stopPropagation(); mostrarModalReferencia(${indexOriginal})">
                <span class="material-icons">visibility</span> Vista Previa
            </button>
        </div>`;
    return card;
}

// Función para obtener la clase de estado
function obtenerClaseEstado(estadoCve) {
    const clases = {
        'P': 'status-pending', 'C': 'status-processing', 'D': 'status-dispatch', 'T': 'status-completed'
    };
    return clases[String(estadoCve).toUpperCase()] || 'status-pending';
}

// Validar fechas al perder el foco
const fechaInicialInput = document.getElementById('fechaInicial');
const fechaFinalInput = document.getElementById('fechaFinal');

if (fechaInicialInput) fechaInicialInput.addEventListener('blur', validarFormatoFechaInput);
if (fechaFinalInput) fechaFinalInput.addEventListener('blur', validarFormatoFechaInput);

function validarFormatoFechaInput(e) {
    const input = e.target;
    const regex = /^(?:(?:31(\/|-|\.)(?:0?[13578]|1[02]))\1|(?:(?:29|30)(\/|-|\.)(?:0?[13-9]|1[0-2])\2))(?:(?:1[6-9]|[2-9]\d)?\d{2})$|^(?:29(\/|-|\.)0?2\3(?:(?:(?:1[6-9]|[2-9]\d)?(?:0[48]|[2468][048]|[13579][26])|(?:(?:16|[2468][048]|[3579][26])00))))$|^(?:0?[1-9]|1\d|2[0-8])(\/|-|\.)(?:(?:0?[1-9])|(?:1[0-2]))\4(?:(?:1[6-9]|[2-9]\d)?\d{2})$/;

    if (input.value !== '' && !regex.test(input.value)) {
        input.style.borderColor = 'var(--danger-color)';
        mostrarAlerta('Formato de fecha inválido. Use DD/MM/AAAA.', 'error');
    } else {
        input.style.borderColor = '';
    }
}

// Inicializar listeners al cargar el script
document.addEventListener('DOMContentLoaded', () => {
    const btnLimpiar = document.getElementById('btnLimpiar');
    if (btnLimpiar) {
        btnLimpiar.addEventListener('click', limpiarFormulario);
    }

    const btnConsultar = document.getElementById('btnConsultar');
    if (btnConsultar) {
        btnConsultar.addEventListener('click', consultarReferencias);
    }
    
    const searchInput = document.getElementById('searchReferencia');
    if (searchInput) {
        searchInput.addEventListener('keyup', filtrarReferencias);
    }
});