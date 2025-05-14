// routes/apiExternaRoutes.js
const express = require('express');
const router = express.Router();
const apiExternaController = require('../controllers/apiExternaController');
const { verifyToken, checkRole } = require('../middlewares/auth');

// Ruta para consultar API externa (requiere autenticación y rol de ADMIN o USER)
router.post(
  "/",
  verifyToken, // Verificar token JWT
  checkRole(["ADMIN", "USER"]), // Verificar que el usuario tenga rol ADMIN o USER
  apiExternaController.consultarApiExterna
);

module.exports = router; 