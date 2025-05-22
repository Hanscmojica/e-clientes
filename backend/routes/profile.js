const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/auth');
const { validatePassword } = require('../middlewares/validation');
const profileController = require('../controllers/profileController');

// Ruta para obtener el estado de la contraseña
router.get('/password-status', verifyToken, profileController.getPasswordStatus);

// Ruta para cambiar la contraseña
router.post('/change-password', 
    verifyToken, 
    validatePassword, 
    profileController.changePassword
);

module.exports = router; 