// backend_node_ftp.js
// Requiere Node.js y haber instalado: express, cors, basic-ftp, multer
// Instalar con: npm install express cors basic-ftp multer

const express = require('express');
const cors = require('cors');
const ftp = require('basic-ftp');
const multer = require('multer');
const stream = require('stream');
const path = require('path');

// --- Configuración del servidor FTPS (cambia estos valores reales) ---
const FTP_CONFIG = {
    host: "127.0.0.1",
    port: 21,
    user: "eclientes",
    password: "12345",
    secure: true,
    secureOptions: {
        rejectUnauthorized: false // ¡NO USAR EN PRODUCCIÓN si puedes evitarlo!
    }
};

const FTP_BASE_DIR = "/";
const SERVER_PORT = 5001;

// --- Inicializar servidor Express ---
const app = express();
app.use(cors());

// --- Configurar multer para manejar archivos en memoria ---
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// --- Función de conexión a FTPS ---
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

// --- Ruta: Listar archivos ---
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

// --- Ruta: Subir archivo ---
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

// --- Ruta: Descargar archivo ---
app.get('/download/:filename', async (req, res) => {
    const filename = decodeURIComponent(req.params.filename);
    const remotePath = path.join(FTP_BASE_DIR, filename).replace(/\\/g, '/');

    let client;
    try {
        client = await connectAndLogin();
        await client.size(remotePath); // Verifica existencia del archivo

        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
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

// --- Iniciar el servidor ---
app.listen(SERVER_PORT, '0.0.0.0', () => {
    console.log(`Servidor Node.js escuchando en http://localhost:${SERVER_PORT}`);
});
