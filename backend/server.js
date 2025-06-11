require('dotenv').config();
const express = require('express');
const http = require('http');
const https = require('https');
const fs = require('fs');
const cors = require('cors');
const ftp = require('basic-ftp');
const multer = require('multer');
const stream = require('stream');
const path = require('path');
const mysql = require('mysql2/promise');

// ✅ IMPORTAR CONFIGURACIÓN Y SERVICIOS FTP

const ftpConfig = require('./config/ftp');           
const ftpService = require('./services/ftpService');  

// Importar rutas
const v1ApiExternaRouter = require("./routes/apiExternaRoutes");
const authRouter = require('./routes/auth');
const accountAccessRouter = require('./routes/accountAccess');
const profileRouter = require('./routes/profile');
const adminRoutes = require('./routes/admin');

// Inicializar app
const app = express();

// Configuración SSL
const sslOptions = {
    key: fs.readFileSync(path.join(__dirname, process.env.SSL_KEY_PATH)),
    cert: fs.readFileSync(path.join(__dirname, process.env.SSL_CERT_PATH))
};

// Test de conexión a base de datos
async function testDatabaseConnection() {
    try {
        const connection = await mysql.createConnection({
            uri: process.env.DATABASE_URL
        });
        console.log('✅ Conexión a base de datos exitosa');
        await connection.end();
    } catch (err) {
        console.error('❌ Error de conexión a base de datos:', {
            message: err.message,
            code: err.code,
            stack: err.stack
        });
    }
}

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));
app.use(express.static(path.join(__dirname, '../')));

// ...existing code... (el resto del código permanece igual, solo eliminé las duplicaciones)

// Crear servidores HTTP y HTTPS
// const httpServer = http.createServer(app);
const httpsServer = https.createServer(sslOptions, app);

// // Iniciar ambos servidores
// httpServer.listen(process.env.PORT, 'e-clientes.rodall.com', () => {
//     console.log(`🌐 Servidor HTTP ejecutándose en http://${process.env.DOMAIN}:${process.env.PORT}`);
// });

httpsServer.listen(process.env.SSL_PORT, 'e-clientes.rodall.com', () => {
    console.log(`🔒 Servidor HTTPS ejecutándose en https://${process.env.DOMAIN}:${process.env.SSL_PORT}`);
    testDatabaseConnection();
});

// if (process.env.NODE_ENV === 'production') {
//     app.use((req, res, next) => {
//         if (!req.secure) {
//             return res.redirect(`https://${process.env.DOMAIN}:${process.env.SSL_PORT}${req.url}`);
//         }
//         next();
//     });
// }
// ✅ CONFIGURACIÓN CORREGIDA - USAR .ENV
// const SERVER_PORT = process.env.PORT || 5001;

// ✅ MOSTRAR CONFIGURACIÓN AL INICIO
console.log('🔧 Configuración FTP:');
console.log(`   Host: ${ftpConfig.host}`);
console.log(`   Puerto: ${ftpConfig.port}`);
console.log(`   Usuario: ${ftpConfig.user}`);
console.log(`   Seguro: ${ftpConfig.secure}`);
console.log(`   Ruta base: ${ftpConfig.basePath}`);


// // Inicializar app
// // Para obtener IPs reales detrás de proxies
// app.set('trust proxy', true);


// Configurar multer para manejar archivos en memoria
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// ✅ FUNCIÓN DE CONEXIÓN MEJORADA (COMPATIBILIDAD)
async function connectAndLogin() {
    const client = new ftp.Client();
    client.ftp.timeout = 60000; // 60 segundos timeout
    
    try {
        console.log(`🔄 Conectando a FTP: ${ftpConfig.host}:${ftpConfig.port}`);
        console.log(`🔐 Usuario: ${ftpConfig.user}, Seguro: ${ftpConfig.secure}`);
        
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
        if (!client.closed) client.close();
        console.error('❌ Error de conexión FTP:', error.message);
        throw new Error("Error al conectar con el servidor FTP: " + error.message);
    }
}

// CONFIGURAR RUTAS DE API (ORDEN IMPORTANTE)
console.log('🔍 Cargando rutas de admin...');
try {
    console.log('✅ Archivo admin.js encontrado y cargado');
    console.log('✅ Registrando rutas /api/admin/*');
    app.use('/api/admin', adminRoutes); // ← RUTAS DE ADMIN PRIMERO
} catch (error) {
    console.error('❌ ERROR cargando admin.js:', error.message);
}

// Configurar rutas principales
app.use('/api/auth', authRouter);
app.use('/api/v1/apiExterna', v1ApiExternaRouter);
app.use('/api/account-access', accountAccessRouter);
app.use('/api/profile', profileRouter);

// ✅ NUEVAS RUTAS FTP MEJORADAS

// Ruta: Test de conexión FTP
app.get('/api/ftp/test', async (req, res) => {
    try {
        console.log('🧪 Ejecutando test de conexión FTP...');
        
        const result = await ftpService.testConnection();
        res.json(result);
    } catch (error) {
        console.error('❌ Error en test FTP:', error);
        res.status(500).json({
            success: false,
            message: 'Error en test de conexión: ' + error.message
        });
    }
});

// Ruta: Verificar documentos para una referencia específica
app.get('/api/referencias/:id/documentos', async (req, res) => {
    const { id: referenciaId } = req.params;
    
    try {
        console.log(`🔍 Consultando documentos para referencia: ${referenciaId}`);
        
        const result = await ftpService.checkReferenceExists(referenciaId);
        
        if (result.exists) {
            res.json({
                success: true,
                data: {
                    hasDocuments: true,
                    filesCount: result.filesCount,
                    documents: result.files,
                    message: `Se encontraron ${result.filesCount} documento(s)`
                }
            });
        } else {
            res.json({
                success: true,
                data: {
                    hasDocuments: false,
                    filesCount: 0,
                    message: result.message
                }
            });
        }
        
    } catch (error) {
        console.error('❌ Error consultando documentos:', error);
        res.status(500).json({
            success: false,
            message: 'Error al consultar documentos: ' + error.message
        });
    }
});

// Rutas de prueba
app.post('/api/test', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'El servidor está funcionando correctamente'
    });
});

app.post('/api/auth/test', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Servicio de autenticación funciona correctamente',
        testUser: {
            username: 'HANS',
            password: '12345',
            description: 'Usar esta cuenta para probar el login'
        }
    });
});

// Ruta: Logout simplificado
app.post('/api/auth/logout', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Sesión cerrada correctamente'
    });
});

// ✅ RUTA MEJORADA: Listar archivos en la raíz
app.get('/list', async (req, res) => {
    let client;
    try {
        client = await connectAndLogin();
        const list = await client.list(ftpConfig.basePath);

        const formattedList = list.map(item => {
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

        console.log(`✅ Lista de archivos obtenida: ${formattedList.length} elementos`);
        res.json(formattedList);
    } catch (err) {
        console.error("❌ Error en /list:", err.message);
        res.status(500).json({ 
            error: `Error al listar archivos: ${err.message}`,
            config: {
                host: ftpConfig.host,
                port: ftpConfig.port,
                secure: ftpConfig.secure
            }
        });
    } finally {
        if (client && !client.closed) client.close();
    }
});

// ✅ RUTA CORREGIDA: Listar archivos en un subdirectorio
app.get('/list/:subdirectory', async (req, res) => {
    const subdirectory = decodeURIComponent(req.params.subdirectory);
    // ✅ USAR DocumentacionPublica como base
    const remotePath = path.join(ftpConfig.basePath, 'DocumentacionPublica', subdirectory).replace(/\\/g, '/');
    
    let client;
    try {
        console.log(`📁 Listando directorio CORREGIDO: ${remotePath}`);
        client = await connectAndLogin();
        const list = await client.list(remotePath);

        const formattedList = list.map(item => {
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

        console.log(`✅ Directorio ${subdirectory} listado CORRECTAMENTE: ${formattedList.length} elementos`);
        res.json(formattedList);
    } catch (err) {
        console.error(`❌ Error en /list/${subdirectory}:`, err.message);
        if (err.code === 550) {  // Código FTP para "Archivo o directorio no encontrado"
            return res.status(404).json({ 
                error: "No se encontró la carpeta de documentos para esta referencia en el servidor.",
                message: "No existen documentos para esta referencia",
                searchedPath: remotePath
            });
        }
        res.status(500).json({ 
            error: `Error al listar directorio: ${err.message}`,
            config: {
                host: ftpConfig.host,
                port: ftpConfig.port,
                secure: ftpConfig.secure
            }
        });
    } finally {
        if (client && !client.closed) client.close();
    }
});

// ✅ RUTA MEJORADA: Subir archivo
app.post('/upload', upload.single('file'), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: "No se recibió ningún archivo" });

    const filename = req.file.originalname;
    const remotePath = path.join(ftpConfig.basePath, filename).replace(/\\/g, '/');

    let client;
    try {
        console.log(`📤 Subiendo archivo: ${filename}`);
        client = await connectAndLogin();
        const readableStream = new stream.PassThrough();
        readableStream.end(req.file.buffer);

        await client.uploadFrom(readableStream, remotePath);
        console.log(`✅ Archivo ${filename} subido correctamente`);
        res.json({ message: `Archivo '${filename}' subido correctamente` });
    } catch (err) {
        console.error("❌ Error en /upload:", err.message);
        res.status(500).json({ 
            error: `Error al subir archivo: ${err.message}`,
            config: {
                host: ftpConfig.host,
                port: ftpConfig.port,
                secure: ftpConfig.secure
            }
        });
    } finally {
        if (client && !client.closed) client.close();
    }
});

// ✅ RUTA MEJORADA: Descargar archivo
app.get('/download/:filename', async (req, res) => {
    const filename = decodeURIComponent(req.params.filename);
    const remotePath = path.join(ftpConfig.basePath, filename).replace(/\\/g, '/');

    let client;
    try {
        console.log(`📥 Descargando archivo: ${filename}`);
        client = await connectAndLogin();
        await client.size(remotePath); // Verifica existencia del archivo

        res.setHeader('Content-Disposition', `attachment; filename="${path.basename(remotePath)}"`);
        res.setHeader('Content-Type', 'application/octet-stream');

        await client.downloadTo(res, remotePath);
        console.log(`✅ Archivo ${filename} descargado correctamente`);
    } catch (err) {
        console.error("❌ Error en /download:", err.message);
        if (!res.headersSent) {
            res.status(err.code === 550 ? 404 : 500).json({
                error: err.code === 550 ? "Archivo no encontrado en el servidor FTP" : `Error al descargar: ${err.message}`,
                config: {
                    host: ftpConfig.host,
                    port: ftpConfig.port,
                    secure: ftpConfig.secure
                }
            });
        }
    } finally {
        if (client && !client.closed) client.close();
    }
});

// ✅ RUTA CORREGIDA: Descargar archivo de una referencia específica
app.get('/download/:referenciaId/:filename', async (req, res) => {
    const referenciaId = req.params.referenciaId;
    const filename = decodeURIComponent(req.params.filename);
    // ✅ USAR DocumentacionPublica como base
    const remotePath = path.join(ftpConfig.basePath, 'DocumentacionPublica', referenciaId, filename).replace(/\\/g, '/');

    let client;
    try {
        console.log(`📥 Descargando archivo CORREGIDO de referencia ${referenciaId}: ${filename}`);
        console.log(`📁 Ruta completa: ${remotePath}`);
        client = await connectAndLogin();
        await client.size(remotePath); // Verifica existencia del archivo

        res.setHeader('Content-Disposition', `attachment; filename="${path.basename(remotePath)}"`);
        res.setHeader('Content-Type', 'application/octet-stream');

        await client.downloadTo(res, remotePath);
        console.log(`✅ Archivo ${filename} de referencia ${referenciaId} descargado`);
    } catch (err) {
        console.error(`❌ Error en /download/${referenciaId}/${filename}:`, err.message);
        if (!res.headersSent) {
            res.status(err.code === 550 ? 404 : 500).json({
                error: err.code === 550 ? "Archivo no encontrado en el servidor FTP" : `Error al descargar: ${err.message}`,
                searchedPath: remotePath,
                config: {
                    host: ftpConfig.host,
                    port: ftpConfig.port,
                    secure: ftpConfig.secure
                }
            });
        }
    } finally {
        if (client && !client.closed) client.close();
    }
});

// ✅ RUTA MEJORADA: Ver archivo
app.get('/view/:filename', async (req, res) => {
    const filename = decodeURIComponent(req.params.filename);
    const remotePath = path.join(ftpConfig.basePath, filename).replace(/\\/g, '/');

    let client;
    try {
        console.log(`👁️ Visualizando archivo: ${filename}`);
        client = await connectAndLogin();
        
        // Determinar el tipo de contenido basado en la extensión
        const ext = path.extname(path.basename(remotePath)).toLowerCase();
        let contentType = 'application/octet-stream';
        
        if (ext === '.pdf') contentType = 'application/pdf';
        else if (['.jpg', '.jpeg'].includes(ext)) contentType = 'image/jpeg';
        else if (ext === '.png') contentType = 'image/png';
        else if (ext === '.gif') contentType = 'image/gif';
        else if (ext === '.txt') contentType = 'text/plain';
        else if (ext === '.xml') contentType = 'application/xml';
        
        res.setHeader('Content-Type', contentType);
        
        // Para imágenes, PDFs y XML, configurar para visualización en línea
        if (contentType.startsWith('image/') || contentType === 'application/pdf' || contentType === 'application/xml') {
            res.setHeader('Content-Disposition', `inline; filename="${path.basename(remotePath)}"`);
        } else {
            res.setHeader('Content-Disposition', `attachment; filename="${path.basename(remotePath)}"`);
        }

        await client.downloadTo(res, remotePath);
        console.log(`✅ Archivo ${filename} visualizado correctamente`);
    } catch (err) {
        console.error("❌ Error en /view:", err.message);
        if (!res.headersSent) {
            res.status(err.code === 550 ? 404 : 500).json({
                error: err.code === 550 ? "Archivo no encontrado en el servidor FTP" : `Error al visualizar: ${err.message}`,
                config: {
                    host: ftpConfig.host,
                    port: ftpConfig.port,
                    secure: ftpConfig.secure
                }
            });
        }
    } finally {
        if (client && !client.closed) client.close();
    }
});

// ✅ RUTA CORREGIDA: Ver archivo de una referencia específica
app.get('/view/:referenciaId/:filename', async (req, res) => {
    const referenciaId = req.params.referenciaId;
    const filename = decodeURIComponent(req.params.filename);
    // ✅ USAR DocumentacionPublica como base
    const remotePath = path.join(ftpConfig.basePath, 'DocumentacionPublica', referenciaId, filename).replace(/\\/g, '/');

    let client;
    try {
        console.log(`👁️ Visualizando archivo CORREGIDO de referencia ${referenciaId}: ${filename}`);
        console.log(`📁 Ruta completa: ${remotePath}`);
        client = await connectAndLogin();
        
        // Determinar el tipo de contenido basado en la extensión
        const ext = path.extname(path.basename(remotePath)).toLowerCase();
        let contentType = 'application/octet-stream';
        
        if (ext === '.pdf') contentType = 'application/pdf';
        else if (['.jpg', '.jpeg'].includes(ext)) contentType = 'image/jpeg';
        else if (ext === '.png') contentType = 'image/png';
        else if (ext === '.gif') contentType = 'image/gif';
        else if (ext === '.txt') contentType = 'text/plain';
        else if (ext === '.xml') contentType = 'application/xml';
        else if (['.doc', '.docx'].includes(ext)) contentType = 'application/msword';
        else if (['.xls', '.xlsx'].includes(ext)) contentType = 'application/vnd.ms-excel';
        
        res.setHeader('Content-Type', contentType);
        
        // Para imágenes, PDFs y XML, configurar para visualización en línea
        if (contentType.startsWith('image/') || contentType === 'application/pdf' || contentType === 'application/xml') {
            res.setHeader('Content-Disposition', `inline; filename="${path.basename(remotePath)}"`);
        } else {
            res.setHeader('Content-Disposition', `attachment; filename="${path.basename(remotePath)}"`);
        }

        await client.downloadTo(res, remotePath);
        console.log(`✅ Archivo ${filename} de referencia ${referenciaId} visualizado`);
    } catch (err) {
        console.error(`❌ Error en /view/${referenciaId}/${filename}:`, err.message);
        if (!res.headersSent) {
            res.status(err.code === 550 ? 404 : 500).json({
                error: err.code === 550 ? "Archivo no encontrado en el servidor FTP" : `Error al visualizar: ${err.message}`,
                searchedPath: remotePath,
                config: {
                    host: ftpConfig.host,
                    port: ftpConfig.port,
                    secure: ftpConfig.secure
                }
            });
        }
    } finally {
        if (client && !client.closed) client.close();
    }
});

// Ruta principal para servir el frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../login.html'));
});

// Middleware de manejo de errores
app.use((err, req, res, next) => {
    console.error('❌ Error no manejado:', err);
    res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
    });
});
