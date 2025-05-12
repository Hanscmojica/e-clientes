// services/ftpService.js
const ftp = require('basic-ftp');
const path = require('path');
const stream = require('stream');
const ftpConfig = require('../config/ftp');

// Función para conectar al servidor FTP
async function connectAndLogin() {
    const client = new ftp.Client();
    try {
        await client.access(ftpConfig);
        return client;
    } catch (error) {
        if (!client.closed) client.close();
        throw new Error("Error al conectar o autenticar con el servidor FTPS: " + error.message);
    }
}

// Listar archivos en un directorio
exports.listFiles = async (directory) => {
    const remotePath = path.join(ftpConfig.basePath, directory).replace(/\\/g, '/');
    let client;
    
    try {
        client = await connectAndLogin();
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
        throw error;
    } finally {
        if (client && !client.closed) client.close();
    }
};

// Subir un archivo
exports.uploadFile = async (fileBuffer, filename) => {
    const remotePath = path.join(ftpConfig.basePath, filename).replace(/\\/g, '/');
    let client;
    
    try {
        client = await connectAndLogin();
        const readableStream = new stream.PassThrough();
        readableStream.end(fileBuffer);

        await client.uploadFrom(readableStream, remotePath);
        return true;
    } catch (error) {
        throw error;
    } finally {
        if (client && !client.closed) client.close();
    }
};

// Descargar un archivo
exports.downloadFile = async (response, filename) => {
    const remotePath = path.join(ftpConfig.basePath, filename).replace(/\\/g, '/');
    let client;
    
    try {
        client = await connectAndLogin();
        // Verificar que el archivo existe
        await client.size(remotePath);
        // Descargar el archivo
        await client.downloadTo(response, remotePath);
        return true;
    } catch (error) {
        throw error;
    } finally {
        if (client && !client.closed) client.close();
    }
};