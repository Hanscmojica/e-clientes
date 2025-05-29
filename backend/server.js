// server.js - Versión corregida
const express = require('express');
const cors = require('cors');
const ftp = require('basic-ftp');
const multer = require('multer');
const stream = require('stream');
const path = require('path');
require('dotenv').config();

// Importar rutas
const v1ApiExternaRouter = require("./routes/apiExternaRoutes");
const authRouter = require('./routes/auth');
const accountAccessRouter = require('./routes/accountAccess');
const profileRouter = require('./routes/profile');
const adminRoutes = require('./routes/admin');

// Configuración
const FTP_CONFIG = {
    host: "127.0.0.1",
    port: 21,
    user: "eclientes",
    password: "12345",
    secure: true,
    secureOptions: {
        rejectUnauthorized: false 
    }
};
const FTP_BASE_DIR = "/";
const SERVER_PORT = 5001;

// Inicializar app
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
    origin: '*', // Permitir todos los orígenes durante desarrollo
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'], // ← AGREGUÉ PATCH
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true // Para cookies si es necesario
}));
app.use(express.static(path.join(__dirname, '../')));

// Configurar multer para manejar archivos en memoria
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Función de conexión a FTPS
async function connectAndLogin() {
    const client = new ftp.Client();
    try {
        await client.access(FTP_CONFIG);
        return client;
    } catch (error) {
        if (!client.closed) client.close();
        throw new Error("Error al conectar o autenticar con el servidor FTPS: " + error.message);
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

// Ruta: Listar archivos en la raíz
app.get('/list', async (req, res) => {
    let client;
    try {
        client = await connectAndLogin();
        const list = await client.list(FTP_BASE_DIR);

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

        res.json(formattedList);
    } catch (err) {
        console.error("Error en /list:", err);
        res.status(500).json({ error: err.message });
    } finally {
        if (client && !client.closed) client.close();
    }
});

// Ruta: Listar archivos en un subdirectorio
app.get('/list/:subdirectory', async (req, res) => {
    const subdirectory = decodeURIComponent(req.params.subdirectory);
    const remotePath = path.join(FTP_BASE_DIR, subdirectory).replace(/\\/g, '/');
    
    let client;
    try {
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

        res.json(formattedList);
    } catch (err) {
        console.error(`Error en /list/${subdirectory}:`, err);
        if (err.code === 550) {  // Código FTP para "Archivo o directorio no encontrado"
            return res.status(404).json({ error: "No se encontró la carpeta de documentos para esta referencia en el servidor." });
        }
        res.status(500).json({ error: err.message });
    } finally {
        if (client && !client.closed) client.close();
    }
});

// Ruta: Subir archivo
app.post('/upload', upload.single('file'), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: "No se recibió ningún archivo" });

    const filename = req.file.originalname;
    const remotePath = path.join(FTP_BASE_DIR, filename).replace(/\\/g, '/');

    let client;
    try {
        client = await connectAndLogin();
        const readableStream = new stream.PassThrough();
        readableStream.end(req.file.buffer);

        await client.uploadFrom(readableStream, remotePath);
        res.json({ message: `Archivo '${filename}' subido correctamente` });
    } catch (err) {
        console.error("Error en /upload:", err);
        res.status(500).json({ error: err.message || "Error al subir el archivo" });
    } finally {
        if (client && !client.closed) client.close();
    }
});

// Ruta: Descargar archivo
app.get('/download/:filename', async (req, res) => {
    const filename = decodeURIComponent(req.params.filename);
    const remotePath = path.join(FTP_BASE_DIR, filename).replace(/\\/g, '/');

    let client;
    try {
        client = await connectAndLogin();
        await client.size(remotePath); // Verifica existencia del archivo

        res.setHeader('Content-Disposition', `attachment; filename="${path.basename(remotePath)}"`);
        res.setHeader('Content-Type', 'application/octet-stream');

        await client.downloadTo(res, remotePath);
    } catch (err) {
        console.error("Error en /download:", err);
        if (!res.headersSent) {
            res.status(err.code === 550 ? 404 : 500).json({
                error: err.code === 550 ? "Archivo no encontrado en el servidor FTPS" : err.message
            });
        }
    } finally {
        if (client && !client.closed) client.close();
    }
});

// Ruta: Descargar archivo de una referencia específica
app.get('/download/:referenciaId/:filename', async (req, res) => {
    const referenciaId = req.params.referenciaId;
    const filename = decodeURIComponent(req.params.filename);
    const remotePath = path.join(FTP_BASE_DIR, referenciaId, filename).replace(/\\/g, '/');

    let client;
    try {
        client = await connectAndLogin();
        await client.size(remotePath); // Verifica existencia del archivo

        res.setHeader('Content-Disposition', `attachment; filename="${path.basename(remotePath)}"`);
        res.setHeader('Content-Type', 'application/octet-stream');

        await client.downloadTo(res, remotePath);
    } catch (err) {
        console.error(`Error en /download/${referenciaId}/${filename}:`, err);
        if (!res.headersSent) {
            res.status(err.code === 550 ? 404 : 500).json({
                error: err.code === 550 ? "Archivo no encontrado en el servidor FTPS" : err.message
            });
        }
    } finally {
        if (client && !client.closed) client.close();
    }
});

// Ruta: Ver archivo
app.get('/view/:filename', async (req, res) => {
    const filename = decodeURIComponent(req.params.filename);
    const remotePath = path.join(FTP_BASE_DIR, filename).replace(/\\/g, '/');

    let client;
    try {
        client = await connectAndLogin();
        
        // Determinar el tipo de contenido basado en la extensión
        const ext = path.extname(path.basename(remotePath)).toLowerCase();
        let contentType = 'application/octet-stream';
        
        if (ext === '.pdf') contentType = 'application/pdf';
        else if (['.jpg', '.jpeg'].includes(ext)) contentType = 'image/jpeg';
        else if (ext === '.png') contentType = 'image/png';
        else if (ext === '.gif') contentType = 'image/gif';
        else if (ext === '.txt') contentType = 'text/plain';
        
        res.setHeader('Content-Type', contentType);
        
        // Para imágenes y PDFs, configurar para visualización en línea
        if (contentType.startsWith('image/') || contentType === 'application/pdf') {
            res.setHeader('Content-Disposition', `inline; filename="${path.basename(remotePath)}"`);
        } else {
            res.setHeader('Content-Disposition', `attachment; filename="${path.basename(remotePath)}"`);
        }

        await client.downloadTo(res, remotePath);
    } catch (err) {
        console.error("Error en /view:", err);
        if (!res.headersSent) {
            res.status(err.code === 550 ? 404 : 500).json({
                error: err.code === 550 ? "Archivo no encontrado en el servidor FTPS" : err.message
            });
        }
    } finally {
        if (client && !client.closed) client.close();
    }
});

// Ruta: Ver archivo de una referencia específica
app.get('/view/:referenciaId/:filename', async (req, res) => {
    const referenciaId = req.params.referenciaId;
    const filename = decodeURIComponent(req.params.filename);
    const remotePath = path.join(FTP_BASE_DIR, referenciaId, filename).replace(/\\/g, '/');

    let client;
    try {
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
        
        // Para imágenes y PDFs, configurar para visualización en línea
        if (contentType.startsWith('image/') || contentType === 'application/pdf' || contentType === 'application/xml') {
            res.setHeader('Content-Disposition', `inline; filename="${path.basename(remotePath)}"`);
        } else {
            res.setHeader('Content-Disposition', `attachment; filename="${path.basename(remotePath)}"`);
        }

        await client.downloadTo(res, remotePath);
    } catch (err) {
        console.error(`Error en /view/${referenciaId}/${filename}:`, err);
        if (!res.headersSent) {
            res.status(err.code === 550 ? 404 : 500).json({
                error: err.code === 550 ? "Archivo no encontrado en el servidor FTPS" : err.message
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

// Middleware para rutas no encontradas
app.use('*', (req, res) => {
    console.log('❌ Ruta no encontrada:', req.method, req.originalUrl);
    res.status(404).json({
        success: false,
        message: 'Ruta no encontrada'
    });
});

// Iniciar servidor
app.listen(SERVER_PORT, '0.0.0.0', () => {
    console.log(`🚀 Servidor ejecutándose en http://localhost:${SERVER_PORT}`);
    console.log('📋 Rutas API registradas:');
    console.log('   - /api/auth/*');
    console.log('   - /api/admin/*  ← RUTAS DE ADMINISTRACIÓN');
    console.log('   - /api/profile/*');
    console.log('   - /api/account-access/*');
    console.log('   - /api/v1/apiExterna/*');
    
    // === INICIAR LIMPIADOR DE SESIONES (OPCIONAL) ===
    try {
        const { startSessionCleaner } = require('./scripts/cleanSessions');
        startSessionCleaner();
        console.log('✅ Limpiador de sesiones iniciado');
    } catch (error) {
        console.log('⚠️ No se pudo iniciar limpiador de sesiones:', error.message);
    }
});