// server.js
const express = require('express');
const cors = require('cors');
const ftp = require('basic-ftp');
const multer = require('multer');
const stream = require('stream');
const path = require('path');
const v1ApiExternaRouter = require("./routes/apiExternaRoutes")

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
app.use(cors({
    origin: '*', // Permitir todos los orígenes durante desarrollo
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true // Para cookies si es necesario
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
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

// Ruta: Login simplificado
app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;
    
    if (username === 'usuario' && password === 'password123') {
        res.status(200).json({
            success: true,
            message: 'Login exitoso',
            user: {
                username: 'usuario',
                name: 'Usuario de Prueba',
                role: 'user'
            }
        });
    } else {
        res.status(401).json({
            success: false,
            message: 'Credenciales incorrectas'
        });
    }
});

app.use("/api/v1/apiExterna", v1ApiExternaRouter);

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
    res.sendFile(path.join(__dirname, '../login_form_moderno.html'));
});

// Iniciar servidor
app.listen(SERVER_PORT, '0.0.0.0', () => {
    console.log(`Servidor ejecutándose en http://localhost:${SERVER_PORT}`);
});