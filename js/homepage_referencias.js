// --- Backend URL ---
const BACKEND_URL = 'http://localhost:5001';

// --- Constantes Globales ---
const modalOverlay = document.getElementById('previewModal');
const searchInput = document.getElementById('searchInput');
const filterPills = document.querySelectorAll('.filter-pill');
const referencesContainer = document.getElementById('referencesContainer');

// Estado actual del filtro
let currentFilter = 'todos';
let currentPage = 1;
const itemsPerPage = 24;

// --- Función para Descarga de PDF ---
function downloadPdf(filePath) {
    console.log(`Intentando descargar: ${filePath}`);
    const downloadUrl = `${BACKEND_URL}/download/${encodeURIComponent(filePath)}`;
    console.log(`URL de descarga: ${downloadUrl}`);
    try {
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        console.log(`Petición de descarga para ${filePath} enviada.`);
    } catch (error) {
        console.error(`Error al intentar iniciar descarga para ${filePath}:`, error);
        alert(`Error al iniciar la descarga. Revisa la consola.`);
    }
}

// --- Función para Vista Previa ---
function triggerPreview(filePath, filetype) {
    console.log(`Intentando vista previa para: ${filePath}, Tipo: ${filetype}`);
    const previewableTypes = ['PDF', 'Imagen', 'Texto'];
    if (previewableTypes.includes(filetype)) {
        const viewUrl = `${BACKEND_URL}/view/${encodeURIComponent(filePath)}`;
        console.log(`Abriendo URL de vista previa: ${viewUrl}`);
        window.open(viewUrl, '_blank');
    } else {
        alert(`La vista previa no está disponible para archivos de tipo: ${filetype}. Intenta descargarlo.`);
        console.log(`Vista previa no soportada para tipo: ${filetype}`);
    }
}

// --- Funciones para el Modal ---
async function openPreviewModal(data) {
    console.log("Abriendo modal para referencia:", data.id);
    if (!modalOverlay) {
        console.error("Modal no encontrado.");
        return;
    }
    
    // Extraer solo el ID de referencia sin "#" si existe
    const referenceId = data.id.startsWith('#') ? data.id.substring(1) : data.id;
    
    try {
        // Poblar detalles básicos
        document.getElementById('modalTitle').textContent = `Detalles de la Referencia #${referenceId}`;
        document.getElementById('modalRefId').textContent = `#${referenceId}`;
        document.getElementById('modalContenedor').textContent = data.contenedor;
        document.getElementById('modalFecha').textContent = data.fecha;
        document.getElementById('modalEstado').textContent = data.estado;
        document.getElementById('modalOrigen').textContent = data.origen;
        document.getElementById('modalDestino').textContent = data.destino;
        document.getElementById('modalTipoCarga').textContent = data.tipoCarga;
        document.getElementById('modalPeso').textContent = data.peso;
        document.getElementById('modalBl').textContent = data.bl;
        
        // Configurar el estilo del estado
        const estadoSpan = document.getElementById('modalEstado');
        estadoSpan.className = 'font-medium';
        const estadoClass = `status-${data.estado.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
        if (document.querySelector(`style`)?.sheet?.cssRules) {
            let styleExists = false;
            const styles = document.querySelector(`style`).sheet.cssRules;
            for(let i=0; i<styles.length; i++){
                if(styles[i].selectorText === `.${estadoClass}`) {
                    styleExists = true;
                    break;
                }
            }
            if (styleExists) estadoSpan.classList.add(estadoClass);
            else estadoSpan.classList.add('text-gray-600');
        } else {
            estadoSpan.classList.add('text-gray-600');
        }

        // Mostrar modal con mensaje de carga para docs
        const docListContainer = document.getElementById('modalDocList');
        if(docListContainer) docListContainer.innerHTML = '<p class="text-center text-gray-500 text-sm py-4">Cargando documentos...</p>';
        modalOverlay.classList.add('active');
        renderIcons(modalOverlay);

        // Obtener documentos asociados (usando la nueva ruta con subdirectorio)
        console.log(`Obteniendo documentos para: /list/${referenceId}`);
        const response = await fetch(`${BACKEND_URL}/list/${referenceId}`);
        
        if (!response.ok) {
            let errorMsg = `Error ${response.status}: ${response.statusText}`;
            try {
                const errorData = await response.json();
                errorMsg = `Error del backend: ${errorData.error || errorMsg}`;
            } catch(e){}
            
            // Especialmente manejar 404 (directorio no encontrado)
            if (response.status === 404) {
                errorMsg = "No se encontró la carpeta de documentos para esta referencia en el servidor.";
            }
            throw new Error(errorMsg);
        }
        
        const documents = await response.json();
        console.log(`Documentos recibidos para ${referenceId}:`, documents);

        // Renderizar lista
        renderModalDocList(docListContainer, documents, referenceId);

    } catch (error) {
        console.error("Error al abrir modal o cargar documentos:", error);
        const docListContainer = document.getElementById('modalDocList');
        if(docListContainer) {
            docListContainer.innerHTML = `<p class="text-center text-red-600 text-sm py-4">Error al cargar documentos: ${error.message}</p>`;
        }
        if (!modalOverlay.classList.contains('active')) {
            modalOverlay.classList.add('active');
            renderIcons(modalOverlay);
        }
    }
}

function renderModalDocList(container, documents, referenceId) {
    if (!container) return;
    container.innerHTML = '';

    if (!documents || documents.length === 0) {
        container.innerHTML = '<p class="text-center text-gray-500 text-sm py-4">No se encontraron documentos asociados.</p>';
        return;
    }

    documents.forEach(doc => {
        if (doc.isDir) return; // Omitir directorios

        const listItem = document.createElement('div');
        listItem.className = 'modal-doc-item';
        const safeFilename = doc.filename || doc.title;
        const escapedFilename = safeFilename.replace(/'/g, "\\'");
        const docType = doc.type || 'Archivo';
        
        // Construir la ruta relativa completa para las acciones
        const relativePath = `${referenceId}/${safeFilename}`;
        const escapedRelativePath = relativePath.replace(/'/g, "\\'");
        const itemIcon = `<i data-lucide="${getIconForType(docType)}" class="icon-sm text-gray-500"></i>`;

        listItem.innerHTML = `
            <div class="modal-doc-info">
                ${itemIcon}
                <span class="text-gray-800 font-medium">${doc.title || 'Sin título'}</span>
                <span class="text-gray-400">(${doc.size || 'N/A'})</span>
            </div>
            <div class="modal-doc-actions space-x-2">
                <button onclick="downloadPdf('${escapedRelativePath}')" class="text-green-600 hover:text-green-800 p-1 text-xs" title="Descargar">
                    <i data-lucide="download" class="icon-sm"></i> Descargar
                </button>
                <button onclick="triggerPreview('${escapedRelativePath}', '${docType}')" class="text-indigo-600 hover:text-indigo-800 p-1 text-xs" title="Vista Previa">
                    <i data-lucide="eye" class="icon-sm"></i> Ver
                </button>
            </div>
        `;
        container.appendChild(listItem);
    });

    renderIcons(container);
}

function getIconForType(docType) {
    switch (docType) {
        case 'PDF': return 'file-type-pdf';
        case 'Imagen': return 'image';
        case 'Texto': return 'file-text';
        case 'Word': return 'file-type-word';
        case 'Excel': return 'file-spreadsheet';
        case 'Comprimido': return 'file-archive';
        case 'Carpeta': return 'folder';
        default: return 'file';
    }
}

function closePreviewModal() {
    if (modalOverlay) {
        modalOverlay.classList.remove('active');
    } else {
        console.error("Modal no encontrado al cerrar.");
    }
}

// --- Función para filtrar las referencias ---
function filterReferences() {
    const searchTerm = searchInput.value.toLowerCase();
    const referenceCards = referencesContainer.querySelectorAll('.reference-card');
    
    let visibleCount = 0;
    
    referenceCards.forEach(card => {
        const refId = (card.getAttribute('data-ref-id') || '').toLowerCase();
        const estado = card.getAttribute('data-estado');
        const mercancia = card.getAttribute('data-mercancia')?.toLowerCase() || '';
        const buque = card.getAttribute('data-buque')?.toLowerCase() || '';
        const contenedorElement = card.querySelector('p:nth-of-type(1)');
        const contenedor = contenedorElement ? contenedorElement.textContent.toLowerCase().split(': ')[1] || '' : '';
        
        const matchesSearch = searchTerm === '' || 
                             refId.includes(searchTerm) || 
                             contenedor.includes(searchTerm) ||
                             mercancia.includes(searchTerm) ||
                             buque.includes(searchTerm);
                             
        const matchesFilter = currentFilter === 'todos' || estado === currentFilter;
        
        const shouldShow = matchesSearch && matchesFilter;
        card.style.display = shouldShow ? '' : 'none';
        
        if (shouldShow) visibleCount++;
    });
    
    // Mostrar mensaje si no hay resultados
    if (visibleCount === 0) {
        if (!document.getElementById('no-results-message')) {
            const noResultsMsg = document.createElement('div');
            noResultsMsg.id = 'no-results-message';
            noResultsMsg.className = 'text-center py-8 text-gray-500';
            noResultsMsg.innerHTML = 'No se encontraron referencias que coincidan con tu búsqueda.';
            referencesContainer.appendChild(noResultsMsg);
        }
    } else {
        const noResultsMsg = document.getElementById('no-results-message');
        if (noResultsMsg) noResultsMsg.remove();
        
        // Aplicar paginación solo a los resultados filtrados
        applyPagination();
    }
}

// --- Función para renderizar iconos ---
function renderIcons(context = document) {
    if (typeof lucide !== 'undefined' && lucide && typeof lucide.createIcons === 'function') {
        try {
            lucide.createIcons({ context });
        } catch (error) {
            console.error("Error al renderizar iconos Lucide:", error);
        }
    } else {
        if (!window.lucideCheckFailed) {
            console.warn("Lucide no definido.");    
            window.lucideCheckFailed = true;
        }
    }
}

// --- Función para obtener clase de estado ---
function getEstadoClass(estado) {
    if (!estado) return 'text-gray-600';
    
    const e = estado.toLowerCase();
    
    // Mapeo más completo basado en los códigos de estado de SAGA
    if (e.includes('t.') || e.includes('archivada')) return 'text-green-600';
    if (e.includes('f.') || e.includes('facturado')) return 'text-blue-600';
    if (e.includes('j.') || e.includes('pedimento')) return 'text-purple-600';
    if (e.includes('e.') || e.includes('previo')) return 'text-yellow-600';
    if (e.includes('a.') || e.includes('alta')) return 'text-gray-600';
    if (e.includes('@.') || e.includes('recibido')) return 'text-indigo-600';
    if (e.includes('k.') || e.includes('pendiente')) return 'text-orange-600';
    
    // Estados generales
    if (e.includes('liberado')) return 'text-green-600';
    if (e.includes('proceso')) return 'text-yellow-600';
    if (e.includes('tránsito') || e.includes('transito')) return 'text-blue-600';
    if (e.includes('aduana')) return 'text-orange-600';
    
    return 'text-gray-600';
}

// --- Funciones para paginación ---
function renderPagination(totalItems) {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const paginationContainer = document.getElementById('paginationContainer');
    
    if (!paginationContainer) return;
    
    paginationContainer.innerHTML = '';
    
    if (totalPages <= 1) return;
    
    const paginationHTML = `
        <div class="flex items-center justify-center mt-6 space-x-2">
            <button onclick="changePage(${Math.max(1, currentPage - 1)})" class="px-3 py-1 border rounded-md ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}">
                <i data-lucide="chevron-left" class="icon-sm"></i>
            </button>
            <span class="text-sm text-gray-600">Página ${currentPage} de ${totalPages}</span>
            <button onclick="changePage(${Math.min(totalPages, currentPage + 1)})" class="px-3 py-1 border rounded-md ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''}">
                <i data-lucide="chevron-right" class="icon-sm"></i>
            </button>
        </div>
    `;
    
    paginationContainer.innerHTML = paginationHTML;
    renderIcons(paginationContainer);
}

function changePage(page) {
    currentPage = page;
    applyPagination();
}

function applyPagination() {
    const cards = referencesContainer.querySelectorAll('.reference-card');
    
    let visibleCards = Array.from(cards).filter(card => 
        card.style.display !== 'none'
    );
    
    visibleCards.forEach((card, index) => {
        const shouldShowForPage = index >= (currentPage - 1) * itemsPerPage && index < currentPage * itemsPerPage;
        card.style.display = shouldShowForPage ? '' : 'none';
    });
    
    renderPagination(visibleCards.length);
}

// --- Función para cargar referencias desde la API ---
async function cargarReferenciasDesdeAPI(clienteNo = 5951) {
    const apiUrl = 'http://localhost:5001/api/v1/apiExterna';
    const requestBody = {
        ClienteNo: parseInt(clienteNo),
        TipoFecha: 1,
        FechaInicial: "01/01/2022",
        FechaFinal: "31/12/2025"
    };

    try {
        // Limpiar contenedor antes de cargar nuevas referencias
        referencesContainer.innerHTML = '<p class="text-gray-500 text-center py-4">Cargando referencias...</p>';
        
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });

        const result = await response.json();
        console.log("Respuesta API:", result);

        // Limpiar mensaje de carga
        referencesContainer.innerHTML = '';

        if (result.status === "OK" && result.data && Array.isArray(result.data.SDTRef)) {
            const referencias = result.data.SDTRef;
            
            if (referencias.length === 0) {
                referencesContainer.innerHTML = '<p class="text-gray-500 text-center py-4">No se encontraron referencias para este cliente.</p>';
                return;
            }
            
            referencias.forEach(ref => {
                // Asegurarse de que los valores estén definidos para evitar errores
                const referencia = ref.Referencia || 'Sin Referencia';
                const documento = ref.Documento || 'N/A';
                const fecha = ref.Fecha || 'N/A';
                const estado = ref.EstadoCve ? `${ref.EstadoCve}. ${ref.Estado || ''}` : (ref.Estado || 'Desconocido');
                const paisOrigen = ref.PaisOrigen || 'N/A';
                const aduana = ref.Aduana || 'N/A';
                const mercancia = ref.Mercancia || 'N/A';
                const transporte = ref.NombreTransporte || 'N/A';
                
                // Escapar comillas y caracteres especiales para evitar errores en el HTML
                const refEscaped = referencia.replace(/'/g, "\\'").replace(/"/g, '\\"');
                const docEscaped = documento.replace(/'/g, "\\'").replace(/"/g, '\\"');
                const fechaEscaped = fecha.replace(/'/g, "\\'").replace(/"/g, '\\"');
                const estadoEscaped = estado.replace(/'/g, "\\'").replace(/"/g, '\\"');
                const origenEscaped = paisOrigen.replace(/'/g, "\\'").replace(/"/g, '\\"');
                const aduanaEscaped = aduana.replace(/'/g, "\\'").replace(/"/g, '\\"');
                const mercanciaEscaped = mercancia.replace(/'/g, "\\'").replace(/"/g, '\\"');
                const transporteEscaped = transporte.replace(/'/g, "\\'").replace(/"/g, '\\"');
                
                const estadoClass = getEstadoClass(estado);
                
                const tarjetaHTML = `
                    <div class="bg-white overflow-hidden shadow rounded-lg p-5 flex flex-col justify-between reference-card" 
                        data-ref-id="${refEscaped}" 
                        data-estado="${estadoEscaped}"
                        data-mercancia="${mercanciaEscaped}"
                        data-buque="${transporteEscaped}">
                        <div>
                            <h3 class="text-lg leading-6 font-medium text-indigo-600">Referencia #${refEscaped}</h3>
                            <p class="mt-1 max-w-2xl text-sm text-gray-500 truncate">Contenedor: ${docEscaped}</p>
                            <p class="mt-1 text-sm text-gray-500">Fecha: ${fechaEscaped}</p>
                            <p class="mt-1 text-sm text-gray-500">Estado: <span class="font-medium ${estadoClass}">${estadoEscaped}</span></p>
                            <p class="mt-1 text-sm text-gray-500 truncate">Mercancía: ${mercanciaEscaped}</p>
                            <p class="mt-1 text-sm text-gray-500">Buque: ${transporteEscaped}</p>
                        </div>
                        <div class="mt-4 flex flex-wrap gap-2 justify-start">
                            <button onclick="downloadPdf('${refEscaped}/Referencia_${refEscaped}.pdf')" class="inline-flex items-center px-3 py-1.5 border border-transparent text-xs leading-4 font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 btn-transition">
                                <i data-lucide="download" class="icon"></i>PDF
                            </button>
                            <button onclick="openPreviewModal({
                                id: '${refEscaped}',
                                contenedor: '${docEscaped}',
                                fecha: '${fechaEscaped}',
                                estado: '${estadoEscaped}',
                                origen: '${origenEscaped}',
                                destino: '${aduanaEscaped}',
                                tipoCarga: '${mercanciaEscaped}',
                                peso: 'N/A',
                                bl: '${docEscaped}'
                            })" class="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 btn-transition">
                                <i data-lucide="eye" class="icon"></i>Vista Previa
                            </button>
                        </div>
                    </div>
                `;

                referencesContainer.insertAdjacentHTML('beforeend', tarjetaHTML);
            });

            renderIcons();
            
            // Resetear paginación al cargar nuevos datos
            currentPage = 1;
            filterReferences();
        } else {
            referencesContainer.innerHTML = `
                <div class="text-center p-4">
                    <p class="text-red-500">Error al cargar referencias: ${result.message || 'No se recibieron datos válidos'}</p>
                </div>
            `;
        }
    } catch (error) {
        console.error("Error al cargar referencias desde la API:", error);
        referencesContainer.innerHTML = `
            <div class="text-center p-4">
                <p class="text-red-500">Error al cargar referencias: ${error.message}</p>
                <button onclick="cargarReferenciasDesdeAPI()" class="mt-2 px-4 py-2 bg-indigo-600 text-white rounded-md">Reintentar</button>
            </div>
        `;
    }
}

// Función para buscar por cliente
function buscarPorCliente() {
    const clienteNoInput = document.getElementById('clienteNoInput');
    const clienteNo = clienteNoInput.value.trim();
    
    if (!clienteNo || isNaN(clienteNo)) {
        alert('Por favor ingresa un número de cliente válido');
        return;
    }
    
    cargarReferenciasDesdeAPI(clienteNo);
}

// --- Event Listeners ---
if (modalOverlay) {
    modalOverlay.addEventListener('click', (event) => {
        if (event.target === modalOverlay) {
            closePreviewModal();
        }
    });
} else {
    console.warn("Listener no añadido: modalOverlay no encontrado.");
}

document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && modalOverlay?.classList.contains('active')) {
        closePreviewModal();
    }
});

filterPills.forEach(pill => {
    pill.addEventListener('click', function() {
        filterPills.forEach(p => p.classList.remove('active'));
        this.classList.add('active');
        currentFilter = this.getAttribute('data-filter');
        currentPage = 1; // Reset a la primera página al cambiar filtro
        filterReferences();
    });
});

if (searchInput) {
    searchInput.addEventListener('input', () => {
        currentPage = 1; // Reset a la primera página al buscar
        filterReferences();
    });
} else {
    console.warn("Listener no añadido: searchInput no encontrado.");
}

const menuButton = document.getElementById('mobileMenuButton');
const mobileMenu = document.getElementById('mobile-menu');
if (menuButton && mobileMenu) {
    const openIcon = menuButton.querySelector('svg:not(.hidden)');
    const closeIcon = menuButton.querySelector('svg.hidden');
    if (openIcon && closeIcon) {
        menuButton.addEventListener('click', () => {
            const isExpanded = menuButton.getAttribute('aria-expanded') === 'true';
            menuButton.setAttribute('aria-expanded', !isExpanded);
            mobileMenu.classList.toggle('hidden');
            openIcon.classList.toggle('hidden');
            openIcon.classList.toggle('block');
            closeIcon.classList.toggle('hidden');
            closeIcon.classList.toggle('block');
        });
    } else {
        console.warn("Iconos de menú móvil no encontrados.");
    }
} else {
    console.warn("Elementos menú móvil no encontrados.");
}

// --- Inicialización ---
document.addEventListener('DOMContentLoaded', (event) => {
    console.log("Homepage Referencias - DOM cargado.");
    renderIcons(); // Renderizar iconos iniciales
    
    // Asegurarse de que exista el contenedor de paginación
    if (!document.getElementById('paginationContainer')) {
        const paginationDiv = document.createElement('div');
        paginationDiv.id = 'paginationContainer';
        paginationDiv.className = 'mt-6';
        referencesContainer.parentNode.insertBefore(paginationDiv, referencesContainer.nextSibling);
    }
    
    // Asegurarse de que exista el contenedor de búsqueda por cliente
    if (!document.getElementById('clienteNoInput')) {
        const clienteBusquedaHTML = `
            <div class="mb-4 flex items-center space-x-2">
                <input type="number" id="clienteNoInput" class="px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Número de cliente">
                <button onclick="buscarPorCliente()" class="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    <i data-lucide="search" class="icon"></i> Buscar
                </button>
            </div>
        `;
        referencesContainer.insertAdjacentHTML('beforebegin', clienteBusquedaHTML);
        renderIcons();
    }
    
    filterReferences(); // Aplicar filtro inicial
    cargarReferenciasDesdeAPI(); // Cargar referencias desde API
});

// --- Función Logout ---
function logout() {
    console.log("Cerrando sesión...");
    alert("Cerrando sesión... Volviendo a la página de login.");
    window.location.href = 'login_form_moderno.html';
}