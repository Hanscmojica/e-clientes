// Arreglo global para almacenar las referencias
let referencias = [];
let referenciasCompletas = []; // Para guardar las referencias con su historial completo
let referenciasFiltradas = []; // Para guardar las referencias filtradas
const itemsPorPagina = 8; // Ajustado para las tarjetas
let paginaActual = 1;

// Obtener el modal
const modal = document.getElementById('historialModal'); // Asegúrate que este ID coincida con tu HTML
const span = document.getElementsByClassName('close')[0]; // Asume que es el primer elemento con clase 'close' en el modal

// Cuando el usuario hace clic en la X, cerrar el modal
if (span) { // Verificar que span exista
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
    const button = e.target.closest('.tab-button'); // Maneja click en el botón o su contenido (ej. icono)
    if (button && modal && modal.contains(button)) { // Asegurarse que el botón está dentro del modal activo
        const tabName = button.dataset.tab;

        // Remover active de todos los botones y paneles DENTRO DEL MODAL
        modal.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
        modal.querySelectorAll('.tab-panel').forEach(panel => panel.classList.remove('active'));

        // Agregar active al botón y panel seleccionado
        button.classList.add('active');
        const tabPanel = modal.querySelector(`#${tabName}-tab`);
        if (tabPanel) {
            tabPanel.classList.add('active');
        } else {
            console.warn(`No se encontró el panel de pestaña: #${tabName}-tab`);
        }
        
        // Si se selecciona la pestaña biblioteca, cargar los documentos
        if (tabName === "biblioteca") {
            const referenciaIndex = parseInt(modal.dataset.referenciaIndex || "0");
            if (referenciasCompletas[referenciaIndex]) {
                generarBibliotecaModal(referenciasCompletas[referenciaIndex]);
            }
        }
    }
});


// Función para filtrar referencias por búsqueda (en la página principal)
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

// Función para actualizar el contador de búsqueda (en la página principal)
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
    return referencias.length > 0 ? {
        nombre: referencias[0].Cliente || '',
        importador: referencias[0].Importador || '',
        aduana: referencias[0].Aduana || ''
    } : {};
}

// Función para limpiar el formulario
function limpiarFormulario() {
    document.getElementById('clienteNo').value = '';
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

// Función principal para consultar referencias
function consultarReferencias() {
    const clienteNo = document.getElementById('clienteNo').value;
    const fechaInicial = document.getElementById('fechaInicial').value;
    const fechaFinal = document.getElementById('fechaFinal').value;

    if (!clienteNo) {
        mostrarAlerta('Por favor, ingrese un número de cliente.', 'error');
        return;
    }
    if (!fechaInicial || !fechaFinal) {
        mostrarAlerta('Por favor, complete las fechas.', 'error');
        return;
    }

    document.getElementById('loading').style.display = 'flex';
    const alertEl = document.getElementById('alert');
    if (alertEl) alertEl.style.display = 'none';
    document.getElementById('referencias-container').innerHTML = '';

    const datos = {
        ClienteNo: parseInt(clienteNo),
        TipoFecha: parseInt(document.getElementById('tipoFecha').value),
        FechaInicial: fechaInicial,
        FechaFinal: fechaFinal
    };

    axios.post('http://localhost:5001/api/v1/apiExterna', datos, {
        headers: { 'Content-Type': 'application/json' }
    })
    .then(res => {
        document.getElementById('loading').style.display = 'none';
        procesarRespuesta(res.data);
    })
    .catch(err => {
        console.error(err);
        document.getElementById('loading').style.display = 'none';
        mostrarAlerta('Error al llamar a la API: ' + err.message, 'error');
    });
}

// Función para mostrar alertas
function mostrarAlerta(mensaje, tipo = 'error') {
    const alertEl = document.getElementById('alert');
    if (!alertEl) return;
    alertEl.textContent = mensaje;
    alertEl.className = `alert ${tipo}`; // Cuidado con sobreescribir otras clases si las tuviera
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
                    const ultimoHistorial = ref.Hist[0]; // Asume que el primero es el más reciente o se ordenará luego
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
        if (isNaN(fecha.getTime())) return fechaStr; // Devuelve original si no es válida
        return fecha.toLocaleDateString('es-MX', {
            year: 'numeric', month: '2-digit', day: '2-digit'
        });
    } catch (e) {
        return fechaStr;
    }
}

// Función para generar la biblioteca de documentos DENTRO DEL MODAL
function generarBibliotecaModal(referenciaOriginal) {
    const listaDocumentosUI = modal.querySelector('#listaDocumentos');
    const noDocumentosMensaje = modal.querySelector('#noDocumentosModalMensaje');

    if (!listaDocumentosUI || !noDocumentosMensaje) {
        console.error("Elementos de la biblioteca no encontrados en el modal.");
        return;
    }
    
    // Mostrar indicador de carga
    listaDocumentosUI.innerHTML = '<li style="text-align:center; padding:20px;">Cargando documentos...</li>';
    noDocumentosMensaje.style.display = 'none';
    
    // Obtener el número de referencia
    const numeroReferencia = referenciaOriginal.Referencia || '';
    
    console.log(`Generando biblioteca para referencia: ${numeroReferencia}`);
    
    if (!numeroReferencia) {
        noDocumentosMensaje.style.display = 'block';
        noDocumentosMensaje.textContent = 'No se pudo identificar la referencia';
        listaDocumentosUI.innerHTML = '';
        return;
    }

    // URL del backend para obtener los documentos de esta referencia
    const BACKEND_URL = 'http://localhost:5001';
    const endpointUrl = `${BACKEND_URL}/list/${numeroReferencia}`;
    
    console.log(`Consultando endpoint: ${endpointUrl}`);
    
    // Llamada al servidor para obtener la lista de documentos
    fetch(endpointUrl)
        .then(response => {
            console.log(`Respuesta del servidor: status=${response.status}`);
            if (!response.ok) {
                throw new Error(`Error del servidor: ${response.status} ${response.statusText}`);
            }
            return response.json();
        })
        .then(documentos => {
            console.log(`Documentos recibidos:`, documentos);
            
            // Limpiar contenedor
            listaDocumentosUI.innerHTML = '';

            if (!documentos || documentos.length === 0) {
                noDocumentosMensaje.style.display = 'block';
                noDocumentosMensaje.textContent = 'No hay documentos disponibles para esta referencia.';
                listaDocumentosUI.style.display = 'none';
                return;
            }

            noDocumentosMensaje.style.display = 'none';
            listaDocumentosUI.style.display = '';

            // Mostrar cada documento en la lista
            documentos.forEach((doc, index) => {
                const li = document.createElement('li');
                
                // Obtener información del documento con manejo de valores nulos/undefined
                const nombreArchivo = doc.title || doc.nombre || doc.filename || `Documento ${index + 1}`;
                const tamanioArchivo = doc.size || '';
                
                // Determinar el icono adecuado según el tipo de archivo
                let iconName = 'description'; // Icono por defecto
                
                if (nombreArchivo.toLowerCase().includes('factura')) iconName = 'receipt';
                else if (nombreArchivo.toLowerCase().includes('bl') || nombreArchivo.toLowerCase().includes('lading')) iconName = 'article';
                else if (nombreArchivo.toLowerCase().includes('cove')) iconName = 'receipt_long';
                else if (nombreArchivo.toLowerCase().includes('.xml')) iconName = 'code';
                else if (nombreArchivo.toLowerCase().includes('.xlsx') || nombreArchivo.toLowerCase().includes('.xls')) iconName = 'assessment';
                else if (nombreArchivo.toLowerCase().includes('pedimento')) iconName = 'assignment';
                
                // Filename seguro para URLs
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
            
            // Si hay un campo de filtro, activar su funcionalidad
            const filtroDocsInput = modal.querySelector('#filtroDocumentosModal');
            if (filtroDocsInput) {
                filtroDocsInput.addEventListener('input', filtrarDocumentosModal);
                // Limpiar el filtro
                filtroDocsInput.value = '';
            }
        })
        .catch(error => {
            console.error("Error al cargar documentos:", error);
            listaDocumentosUI.innerHTML = '';
            noDocumentosMensaje.style.display = 'block';
            noDocumentosMensaje.textContent = 'Error al cargar los documentos: ' + error.message;
        });
}

// Función para ver documento (desde el modal)
function verDocumentoModal(referenciaId, docNombre) {
    const BACKEND_URL = 'http://localhost:5001';
    const viewUrl = `${BACKEND_URL}/view/${referenciaId}/${docNombre}`;
    
    console.log('Abriendo vista previa:', viewUrl);
    mostrarAlerta(`Abriendo vista previa de ${decodeURIComponent(docNombre)}...`, 'success');
    
    // Abrir el documento en una nueva ventana/pestaña
    window.open(viewUrl, '_blank');
}

// Función para descargar documento (desde el modal)
function descargarDocumentoModal(referenciaId, docNombre) {
    const BACKEND_URL = 'http://localhost:5001';
    const downloadUrl = `${BACKEND_URL}/download/${referenciaId}/${docNombre}`;
    
    console.log('Descargando documento:', downloadUrl);
    mostrarAlerta(`Iniciando descarga de ${decodeURIComponent(docNombre)}...`, 'success');
    
    // Crear un elemento <a> invisible para iniciar la descarga
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
        } else if (ul.children.length === 0 || (count === 0 && filter === '')) { // Si no hay documentos originalmente o el filtro está vacío y no hay items
             noDocumentosMensaje.textContent = "No hay documentos disponibles para esta referencia.";
             noDocumentosMensaje.style.display = 'block';
        }
        else {
            noDocumentosMensaje.style.display = 'none';
        }
    }
}

// --- MODIFICACIONES PARA EL MODAL CON PESTAÑAS ---

// Función principal para mostrar el modal de una referencia con todas sus pestañas
function mostrarModalReferencia(indexEnListaMostrada) { // Cambiado el nombre de mostrarHistorial
    const referenciaOriginal = referenciasCompletas[indexEnListaMostrada]; // Usar el índice original de referenciasCompletas

    if (!referenciaOriginal) {
        mostrarAlerta('No se encontró la referencia completa.', 'error');
        return;
    }

    // Guardar el índice de la referencia en el modal para uso posterior
    if (modal) {
        modal.dataset.referenciaIndex = indexEnListaMostrada;
    }

    // Establecer el título del modal
    const modalTitulo = modal.querySelector('#refHistorialTitulo');
    if (modalTitulo) modalTitulo.textContent = `Referencia: ${referenciaOriginal.Referencia || 'N/A'}`;

    // --- Pestaña "Detalle" ---
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

    // --- Pestaña "Biblioteca" ---
    // Llamar a la función generarBibliotecaModal con la referencia actual
    generarBibliotecaModal(referenciaOriginal);

    // --- Pestaña "Historial" ---
    const historialDiv = modal.querySelector('#historialContenido');
    if (historialDiv) {
        historialDiv.innerHTML = ''; // Limpiar
        if (!referenciaOriginal.Hist || referenciaOriginal.Hist.length === 0) {
            historialDiv.innerHTML = '<p style="text-align:center; padding:10px; color:var(--light-text);">No hay registros en el historial.</p>';
        } else {
            const historialOrdenado = [...referenciaOriginal.Hist].sort((a, b) => new Date(b.Fecha) - new Date(a.Fecha));
            historialOrdenado.forEach(item => {
                const itemDiv = document.createElement('div');
                itemDiv.className = `historial-item estado-${(item.Estado || '').toLowerCase()}`; // Asegurar clase válida
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
        // Fallback a la primera pestaña si "detalle" no existe por alguna razón
        const firstButton = modal.querySelector('.tab-button');
        if (firstButton) {
            firstButton.classList.add('active');
            const firstPanelId = firstButton.dataset.tab + '-tab';
            const firstPanel = modal.querySelector(`#${firstPanelId}`);
            if (firstPanel) firstPanel.classList.add('active');
        }
    }
    
    // Limpiar filtro de documentos del modal
    const filtroDocsInput = modal.querySelector('#filtroDocumentosModal');
    if (filtroDocsInput) filtroDocsInput.value = '';
    filtrarDocumentosModal(); // Para mostrar todos inicialmente

    // Mostrar el modal
    if (modal) modal.style.display = "block";
}

// Función para obtener la descripción de un estado
function getEstadoDescripcion(estadoCve) {
    const estados = {
        'P': 'Pendiente', 'C': 'En Proceso', 'D': 'Despacho', 'T': 'Terminado',
        // Añade más si es necesario
    };
    return estados[String(estadoCve).toUpperCase()] || estadoCve || 'Desconocido';
}

// Función para mostrar las referencias en formato de tarjetas (en la página principal)
function mostrarReferencias(clienteInfo, referenciasAMostrarParam) {
    const container = document.getElementById('referencias-container');
    let referenciasAMostrar = referenciasAMostrarParam;

    if (!referenciasAMostrar) {
        referenciasAMostrar = referenciasFiltradas.length > 0 || (document.getElementById('searchReferencia')?.value) ? referenciasFiltradas : referencias;
    }
    container.innerHTML = ''; // Limpiar

    const clienteDiv = document.createElement('div');
    clienteDiv.className = 'cliente-info';
    clienteDiv.innerHTML = `
        <h2>Información del Cliente</h2>
        <div class="cliente-details">
            <div class="cliente-detail-item"><strong>Cliente No:</strong><span>${document.getElementById('clienteNo').value}</span></div>
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
    const totalPaginas = Math.ceil(referenciasAMostrar.length / itemsPorPagina);
    const inicio = (paginaActual - 1) * itemsPorPagina;
    const fin = Math.min(inicio + itemsPorPagina, referenciasAMostrar.length);

    for (let i = inicio; i < fin; i++) {
        // IMPORTANTE: El índice que se pasa a crearTarjetaReferencia es 'i', que es el índice en la lista paginada/filtrada.
        // Pero para mostrarModalReferencia, necesitamos el índice en 'referenciasCompletas'.
        // Buscaremos la referencia completa por su ID único (ej. Referencia)
        const refActualEnLista = referenciasAMostrar[i];
        const indiceEnCompletas = referenciasCompletas.findIndex(rc => rc.Referencia === refActualEnLista.Referencia);
        const card = crearTarjetaReferencia(refActualEnLista, indiceEnCompletas, i); // Pasamos ambos índices
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
// Modificada para aceptar 'indexOriginal' para el modal y 'indexEnVistaActual' para otros usos si es necesario
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
    return clases[String(estadoCve).toUpperCase()] || 'status-pending'; // Default a pending si no se reconoce
}

// Validar fechas al perder el foco
const fechaInicialInput = document.getElementById('fechaInicial');
const fechaFinalInput = document.getElementById('fechaFinal');

if (fechaInicialInput) fechaInicialInput.addEventListener('blur', validarFormatoFechaInput);
if (fechaFinalInput) fechaFinalInput.addEventListener('blur', validarFormatoFechaInput);

function validarFormatoFechaInput(e) { // Renombrada para evitar conflicto
    const input = e.target;
    // Mejor regex para DD/MM/AAAA que considera años válidos y meses/días
    const regex = /^(?:(?:31(\/|-|\.)(?:0?[13578]|1[02]))\1|(?:(?:29|30)(\/|-|\.)(?:0?[13-9]|1[0-2])\2))(?:(?:1[6-9]|[2-9]\d)?\d{2})$|^(?:29(\/|-|\.)0?2\3(?:(?:(?:1[6-9]|[2-9]\d)?(?:0[48]|[2468][048]|[13579][26])|(?:(?:16|[2468][048]|[3579][26])00))))$|^(?:0?[1-9]|1\d|2[0-8])(\/|-|\.)(?:(?:0?[1-9])|(?:1[0-2]))\4(?:(?:1[6-9]|[2-9]\d)?\d{2})$/;

    if (input.value !== '' && !regex.test(input.value)) {
        input.style.borderColor = 'var(--danger-color)'; // Asume que tienes --danger-color en CSS
        mostrarAlerta('Formato de fecha inválido. Use DD/MM/AAAA.', 'error');
    } else {
        input.style.borderColor = ''; // O a var(--border-color)
    }
}

// Inicializar listeners o configuraciones al cargar el script
document.addEventListener('DOMContentLoaded', () => {
    // Si tienes un botón de limpiar, asígnale la función
    const btnLimpiar = document.getElementById('btnLimpiar');
    if (btnLimpiar) {
        btnLimpiar.addEventListener('click', limpiarFormulario);
    }

    // Si tienes un botón de consultar, asígnale la función
    const btnConsultar = document.getElementById('btnConsultar'); // Asume que tu botón de búsqueda tiene id="btnConsultar"
    if (btnConsultar) {
        btnConsultar.addEventListener('click', consultarReferencias);
    }
    
    // Listener para el input de búsqueda de referencias principal
    const searchInput = document.getElementById('searchReferencia');
    if (searchInput) {
        searchInput.addEventListener('keyup', filtrarReferencias);
    }
});