// controllers/fileController.js
const ftpService = require('../services/ftpService');
const path = require('path');

exports.listFiles = async (req, res, next) => {
    try {
        const files = await ftpService.listFiles('/');
        res.json(files);
    } catch (error) {
        next(error);
    }
};

exports.listFilesInDirectory = async (req, res, next) => {
    try {
        const subdirectory = decodeURIComponent(req.params.subdirectory);
        const files = await ftpService.listFiles(subdirectory);
        res.json(files);
    } catch (error) {
        // Manejo específico del error 550 (directorio no encontrado)
        if (error.code === 550) {
            return res.status(404).json({ 
                error: "No se encontró la carpeta de documentos para esta referencia en el servidor." 
            });
        }
        next(error);
    }
};

exports.uploadFile = async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No se recibió ningún archivo" });
        }

        const filename = req.file.originalname;
        await ftpService.uploadFile(req.file.buffer, filename);
        
        res.json({ message: `Archivo '${filename}' subido correctamente` });
    } catch (error) {
        next(error);
    }
};

exports.downloadFile = async (req, res, next) => {
    try {
        const filename = decodeURIComponent(req.params.filename);
        
        // Configurar encabezados para descarga
        res.setHeader('Content-Disposition', `attachment; filename="${path.basename(filename)}"`);
        res.setHeader('Content-Type', 'application/octet-stream');
        
        // Usar el servicio FTP para descargar el archivo
        await ftpService.downloadFile(res, filename);
    } catch (error) {
        // Si no se han enviado encabezados, enviar error
        if (!res.headersSent) {
            if (error.code === 550) {
                return res.status(404).json({
                    error: "Archivo no encontrado en el servidor FTPS"
                });
            }
            next(error);
        }
    }
};

exports.viewFile = async (req, res, next) => {
    try {
        const filename = decodeURIComponent(req.params.filename);
        
        // Determinar tipo de contenido basado en la extensión
        const ext = path.extname(path.basename(filename)).toLowerCase();
        let contentType = 'application/octet-stream';
        
        if (ext === '.pdf') contentType = 'application/pdf';
        else if (['.jpg', '.jpeg'].includes(ext)) contentType = 'image/jpeg';
        else if (ext === '.png') contentType = 'image/png';
        else if (ext === '.gif') contentType = 'image/gif';
        else if (ext === '.txt') contentType = 'text/plain';
        
        res.setHeader('Content-Type', contentType);
        
        // Configurar para visualización en línea
        if (contentType.startsWith('image/') || contentType === 'application/pdf') {
            res.setHeader('Content-Disposition', `inline; filename="${path.basename(filename)}"`);
        } else {
            res.setHeader('Content-Disposition', `attachment; filename="${path.basename(filename)}"`);
        }
        
        // Usar el servicio FTP para descargar el archivo
        await ftpService.downloadFile(res, filename);
    } catch (error) {
        // Si no se han enviado encabezados, enviar error
        if (!res.headersSent) {
            if (error.code === 550) {
                return res.status(404).json({
                    error: "Archivo no encontrado en el servidor FTPS"
                });
            }
            next(error);
        }
    }
};