// routes/auth.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken } = require('../middlewares/auth');

// Rutas públicas de autenticación
router.post('/login', authController.login);
router.get('/login', authController.login);
router.post('/logout', authController.logout);

// Rutas protegidas que requieren autenticación
router.get('/profile', verifyToken, authController.getProfile);

module.exports = router;