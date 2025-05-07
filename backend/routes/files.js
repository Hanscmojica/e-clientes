// routes/files.js
const express = require('express');
const router = express.Router();
const fileController = require('../controllers/fileController');
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Rutas de archivos
router.get('/list', fileController.listFiles);
router.get('/list/:subdirectory', fileController.listFilesInDirectory);
router.post('/upload', upload.single('file'), fileController.uploadFile);
router.get('/download/:filename', fileController.downloadFile);
router.get('/view/:filename', fileController.viewFile);

module.exports = router;