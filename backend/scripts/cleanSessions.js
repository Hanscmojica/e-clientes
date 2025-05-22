// scripts/cleanSessions.js
const cron = require('node-cron');
const authService = require('../services/authService');

// Ejecutar limpieza de sesiones expiradas cada hora
const startSessionCleaner = () => {
  // Ejecutar inmediatamente al iniciar
  authService.cleanExpiredSessions()
    .then(count => console.log(`Limpieza inicial: ${count} sesiones expiradas desactivadas`))
    .catch(error => console.error('Error en limpieza inicial:', error));
  
  // Programar para ejecutar cada hora
  cron.schedule('0 * * * *', async () => {
    console.log('Ejecutando limpieza de sesiones expiradas...');
    try {
      const count = await authService.cleanExpiredSessions();
      console.log(`Limpieza completada: ${count} sesiones desactivadas`);
    } catch (error) {
      console.error('Error al limpiar sesiones:', error);
    }
  });
  
  console.log('Limpiador de sesiones iniciado - Se ejecutará cada hora');
};

// Si se ejecuta directamente
if (require.main === module) {
  startSessionCleaner();
}

module.exports = { startSessionCleaner };