const setupRolesAndPermissions = require('../utils/setupRolesAndPermissions');

async function setupInitialConfig() {
    try {
        console.log('Iniciando configuración inicial del sistema...');
        
        // Configurar roles y permisos
        console.log('Configurando roles y permisos...');
        await setupRolesAndPermissions();
        
        console.log('Configuración inicial completada exitosamente.');
        
    } catch (error) {
        console.error('Error durante la configuración inicial:', error);
        process.exit(1);
    }
}

// Ejecutar si se llama directamente
if (require.main === module) {
    setupInitialConfig()
        .then(() => process.exit(0))
        .catch(error => {
            console.error('Error en la configuración:', error);
            process.exit(1);
        });
} 