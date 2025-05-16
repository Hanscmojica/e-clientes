// routes/auth.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken } = require('../middlewares/auth');
const prisma = require('../utils/prisma');

// Rutas públicas de autenticación
router.post('/login', authController.login);
router.get('/login', authController.login);
router.post('/logout', authController.logout);

// Rutas protegidas que requieren autenticación
router.get('/profile', verifyToken, authController.getProfile);

// Nueva ruta para obtener perfiles
router.get('/profiles', verifyToken, async (req, res) => {
    try {
        const perfiles = await prisma.BP_02_PERFIL.findMany({
            include: {
                perfilesPermiso: {
                    include: {
                        permiso: true
                    }
                }
            }
        });

        res.json({
            success: true,
            perfiles: perfiles.map(perfil => ({
                id: perfil.nId02Perfil,
                nombre: perfil.sNombre,
                descripcion: perfil.sDescripcion,
                permisos: perfil.perfilesPermiso.map(pp => ({
                    nombre: pp.permiso.sNombre,
                    descripcion: pp.permiso.sDescripcion,
                    leer: pp.nLeer,
                    crear: pp.nCrear,
                    editar: pp.nEditar,
                    borrar: pp.nBorrar
                }))
            }))
        });
    } catch (error) {
        console.error('Error al obtener perfiles:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener perfiles'
        });
    }
});

module.exports = router;