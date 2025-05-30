// services/ftpService.js - CORREGIDO PARA DocumentacionPublica
const { Client } = require('basic-ftp');
const path = require('path');
const stream = require('stream');
const ftpConfig = require('../config/ftp');

// ✅ CONFIGURACIÓN DE RUTAS CORREGIDA
const DOCUMENTACION_PUBLICA_PATH = 'DocumentacionPublica'; // ← CARPETA ESPECÍFICA

// ✅ Función de conexión robusta con retry
async function connectAndLogin(retries = 3) {
    const client = new Client();
    client.ftp.timeout = ftpConfig.connTimeout || 60000;
    
    // ✅ Activar logs detallados en desarrollo
    if (process.env.NODE_ENV === 'development') {
        client.ftp.verbose = true;
    }
    
    let lastError;
    
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            console.log(`🔄 Intento ${attempt}/${retries} de conexión FTP a ${ftpConfig.host}:${ftpConfig.port}`);
            
            await client.access({
                host: ftpConfig.host,
                port: ftpConfig.port,
                user: ftpConfig.user,
                password: ftpConfig.password,
                secure: ftpConfig.secure,
                secureOptions: ftpConfig.secureOptions
            });
            
            console.log('✅ Conexión FTP establecida exitosamente!');
            return client;
            
        } catch (error) {
            lastError = error;
            console.error(`❌ Intento ${attempt} falló:`, error.message);
            
            // Cerrar cliente en caso de error
            if (!client.closed) {
                try {
                    client.close();
                } catch (closeError) {
                    console.warn('Advertencia al cerrar cliente:', closeError.message);
                }
            }
            
            // Si no es el último intento, esperar antes de retry
            if (attempt < retries) {
                const delay = attempt * 2000; // 2s, 4s, 6s...
                console.log(`⏳ Esperando ${delay}ms antes del siguiente intento...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }
    
    throw new Error(`No se pudo conectar después de ${retries} intentos: ${lastError.message}`);
}

// ✅ TEST DE CONEXIÓN (FUNCIÓN MEJORADA)
exports.testConnection = async () => {
    let client;
    
    try {
        console.log('🧪 Probando conexión FTP...');
        client = await connectAndLogin(1); // Solo 1 intento para test
        
        // Probar listar directorio raíz
        const files = await client.list(ftpConfig.basePath);
        
        // ✅ PROBAR TAMBIÉN DocumentacionPublica
        const docPublicaPath = path.join(ftpConfig.basePath, DOCUMENTACION_PUBLICA_PATH).replace(/\\/g, '/');
        console.log(`🔍 Probando acceso a: ${docPublicaPath}`);
        
        try {
            const docPublicaFiles = await client.list(docPublicaPath);
            console.log(`✅ DocumentacionPublica encontrada con ${docPublicaFiles.length} elementos`);
        } catch (docError) {
            console.warn(`⚠️ No se pudo acceder a DocumentacionPublica: ${docError.message}`);
        }
        
        console.log('✅ Test de conexión exitoso!');
        return {
            success: true,
            message: 'Conexión FTP establecida correctamente',
            filesInRoot: files.length,
            config: {
                host: ftpConfig.host,
                port: ftpConfig.port,
                user: ftpConfig.user,
                secure: ftpConfig.secure,
                basePath: ftpConfig.basePath,
                documentacionPublicaPath: docPublicaPath
            }
        };
        
    } catch (error) {
        console.error('❌ Test de conexión falló:', error);
        return {
            success: false,
            message: 'Error de conexión FTP: ' + error.message,
            config: {
                host: ftpConfig.host,
                port: ftpConfig.port,
                user: ftpConfig.user,
                secure: ftpConfig.secure,
                basePath: ftpConfig.basePath
            }
        };
    } finally {
        if (client && !client.closed) {
            client.close();
        }
    }
};

// ✅ FUNCIÓN CORREGIDA - Verificar si existe una referencia (carpeta)
exports.checkReferenceExists = async (referenciaId) => {
    let client;
    
    try {
        client = await connectAndLogin();
        
        // ✅ CONSTRUIR RUTA CORRECTA: /DocumentacionPublica/REFERENCIA
        const referencePath = path.join(ftpConfig.basePath, DOCUMENTACION_PUBLICA_PATH, referenciaId.toString()).replace(/\\/g, '/');
        
        console.log(`🔍 Verificando existencia de referencia en ruta CORREGIDA: ${referencePath}`);
        
        try {
            // Intentar listar el contenido de la carpeta
            const files = await client.list(referencePath);
            
            console.log(`✅ Referencia ${referenciaId} encontrada con ${files.length} archivos`);
            
            // ✅ MEJORAR INFORMACIÓN DE ARCHIVOS
            const formattedFiles = files.map(file => {
                let sizeStr = '';
                if (file.isFile && file.size != null) {
                    sizeStr = file.size > 1024 * 1024
                        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
                        : `${Math.round(file.size / 1024)} KB`;
                }

                let docType = file.isDirectory ? 'Carpeta' : 'Archivo';
                if (file.isFile && file.name.includes('.')) {
                    const ext = file.name.split('.').pop().toLowerCase();
                    if (['jpg', 'jpeg', 'png', 'gif'].includes(ext)) docType = 'Imagen';
                    else if (['pdf'].includes(ext)) docType = 'PDF';
                    else if (['doc', 'docx'].includes(ext)) docType = 'Word';
                    else if (['xls', 'xlsx'].includes(ext)) docType = 'Excel';
                    else if (['txt', 'log', 'csv'].includes(ext)) docType = 'Texto';
                    else if (['zip', 'rar', '7z'].includes(ext)) docType = 'Comprimido';
                    else if (['xml'].includes(ext)) docType = 'XML';
                }

                return {
                    name: file.name,
                    filename: file.name,
                    title: file.name,
                    size: sizeStr,
                    type: docType,
                    isDirectory: file.isDirectory,
                    modifiedAt: file.modifiedAt,
                    dateAdded: file.modifiedAt?.toISOString().split('T')[0] || 'N/A'
                };
            });
            
            return {
                exists: true,
                filesCount: files.length,
                files: formattedFiles,
                path: referencePath
            };
            
        } catch (listError) {
            if (listError.code === 550) {
                console.log(`ℹ️ Referencia ${referenciaId} no encontrada en DocumentacionPublica (código 550)`);
                return {
                    exists: false,
                    message: 'No existen documentos para esta referencia',
                    searchedPath: referencePath
                };
            }
            throw listError;
        }
        
    } catch (error) {
        console.error('❌ Error verificando referencia:', error);
        throw error;
    } finally {
        if (client && !client.closed) {
            client.close();
        }
    }
};

// ✅ FUNCIÓN CORREGIDA - Listar archivos en un directorio específico
exports.listFiles = async (directory) => {
    // ✅ USAR DocumentacionPublica como base
    const remotePath = path.join(ftpConfig.basePath, DOCUMENTACION_PUBLICA_PATH, directory).replace(/\\/g, '/');
    let client;
    
    try {
        client = await connectAndLogin();
        console.log(`📁 Listando archivos en ruta CORREGIDA: ${remotePath}`);
        
        const list = await client.list(remotePath);
        
        return list.map(item => {
            let dateAdded = item.modifiedAt?.toISOString().split('T')[0] || 'N/A';

            let sizeStr = '';
            if (item.isFile && item.size != null) {
                sizeStr = item.size > 1024 * 1024
                    ? `${(item.size / (1024 * 1024)).toFixed(1)} MB`
                    : `${Math.round(item.size / 1024)} KB`;
            }

            let docType = item.isDirectory ? 'Carpeta' : 'Archivo';
            if (item.isFile && item.name.includes('.')) {
                const ext = item.name.split('.').pop().toLowerCase();
                if (['jpg', 'jpeg', 'png', 'gif'].includes(ext)) docType = 'Imagen';
                else if (['pdf'].includes(ext)) docType = 'PDF';
                else if (['doc', 'docx'].includes(ext)) docType = 'Word';
                else if (['xls', 'xlsx'].includes(ext)) docType = 'Excel';
                else if (['txt', 'log', 'csv'].includes(ext)) docType = 'Texto';
                else if (['zip', 'rar', '7z'].includes(ext)) docType = 'Comprimido';
                else if (['xml'].includes(ext)) docType = 'XML';
            }

            return {
                id: item.name,
                title: item.name,
                type: docType,
                dateAdded: dateAdded,
                size: sizeStr,
                description: `${docType} FTP`,
                filename: item.name,
                isDir: item.isDirectory
            };
        });
    } catch (error) {
        console.error('❌ Error listando archivos:', error);
        throw error;
    } finally {
        if (client && !client.closed) client.close();
    }
};

// ✅ FUNCIÓN CORREGIDA - Subir archivo
exports.uploadFile = async (fileBuffer, filename, directory = '') => {
    // ✅ USAR DocumentacionPublica como base
    const remotePath = path.join(ftpConfig.basePath, DOCUMENTACION_PUBLICA_PATH, directory, filename).replace(/\\/g, '/');
    let client;
    
    try {
        client = await connectAndLogin();
        console.log(`📤 Subiendo archivo a ruta CORREGIDA: ${remotePath}`);
        
        const readableStream = new stream.PassThrough();
        readableStream.end(fileBuffer);

        await client.uploadFrom(readableStream, remotePath);
        console.log('✅ Archivo subido exitosamente');
        return true;
    } catch (error) {
        console.error('❌ Error subiendo archivo:', error);
        throw error;
    } finally {
        if (client && !client.closed) client.close();
    }
};

// ✅ FUNCIÓN CORREGIDA - Descargar archivo
exports.downloadFile = async (response, filename, directory = '') => {
    // ✅ USAR DocumentacionPublica como base
    const remotePath = path.join(ftpConfig.basePath, DOCUMENTACION_PUBLICA_PATH, directory, filename).replace(/\\/g, '/');
    let client;
    
    try {
        client = await connectAndLogin();
        console.log(`📥 Descargando archivo de ruta CORREGIDA: ${remotePath}`);
        
        // Verificar que el archivo existe
        await client.size(remotePath);
        
        // Descargar el archivo
        await client.downloadTo(response, remotePath);
        console.log('✅ Archivo descargado exitosamente');
        return true;
    } catch (error) {
        console.error('❌ Error descargando archivo:', error);
        throw error;
    } finally {
        if (client && !client.closed) client.close();
    }
};

// ✅ NUEVA FUNCIÓN - Verificar archivo específico
exports.checkFileExists = async (referenciaId, filename) => {
    let client;
    
    try {
        client = await connectAndLogin();
        
        // ✅ CONSTRUIR RUTA CORRECTA: /DocumentacionPublica/REFERENCIA/ARCHIVO
        const filePath = path.join(ftpConfig.basePath, DOCUMENTACION_PUBLICA_PATH, referenciaId.toString(), filename).replace(/\\/g, '/');
        
        console.log(`🔍 Verificando archivo: ${filePath}`);
        
        try {
            const size = await client.size(filePath);
            console.log(`✅ Archivo encontrado: ${filename} (${size} bytes)`);
            return { exists: true, size, path: filePath };
        } catch (error) {
            if (error.code === 550) {
                console.log(`ℹ️ Archivo no encontrado: ${filename}`);
                return { exists: false, path: filePath };
            }
            throw error;
        }
        
    } catch (error) {
        console.error('❌ Error verificando archivo:', error);
        throw error;
    } finally {
        if (client && !client.closed) {
            client.close();
        }
    }
};