// config/ftp.js - VERSIÓN PARA PRODUCCIÓN
// ✅ SIN valores por defecto - FALLA si no está configurado correctamente

// Validar que todas las variables requeridas están presentes
const requiredEnvVars = ['FTP_HOST', 'FTP_PORT', 'FTP_USER', 'FTP_PASSWORD'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
    throw new Error(`❌ Variables de entorno FTP faltantes: ${missingVars.join(', ')}`);
}

// ✅ CONFIGURACIÓN DE PRODUCCIÓN - Solo usa variables de entorno
module.exports = {
    host: process.env.FTP_HOST,                    // ✅ SIN fallback - DEBE estar en .env
    port: parseInt(process.env.FTP_PORT),          // ✅ SIN fallback - DEBE estar en .env  
    user: process.env.FTP_USER,                    // ✅ SIN fallback - DEBE estar en .env
    password: process.env.FTP_PASSWORD,            // ✅ SIN fallback - DEBE estar en .env
    secure: process.env.FTP_SECURE === "true",     // ✅ Convierte string a boolean
    secureOptions: {
        rejectUnauthorized: false 
    },
    basePath: process.env.FTP_BASE_PATH || "/",    // ✅ Este sí puede tener fallback
    // Opciones de conexión robusta
    connTimeout: parseInt(process.env.FTP_TIMEOUT) || 60000,     // 60 segundos por defecto
    pasvTimeout: parseInt(process.env.FTP_PASV_TIMEOUT) || 60000, // 60 segundos pasivo
    keepalive: parseInt(process.env.FTP_KEEPALIVE) || 60000,      // Keep alive
    verbose: process.env.NODE_ENV === 'development'               // Logs solo en desarrollo
};

// ✅ LOG de configuración (sin mostrar password)
console.log('🔧 Configuración FTP validada:');
console.log(`   Host: ${module.exports.host}`);
console.log(`   Puerto: ${module.exports.port}`);
console.log(`   Usuario: ${module.exports.user}`);
console.log(`   Password: ${'*'.repeat(module.exports.password.length)}`);
console.log(`   Seguro: ${module.exports.secure}`);
console.log(`   Ruta base: ${module.exports.basePath}`);
console.log(`   Timeout: ${module.exports.connTimeout}ms`);

// ✅ VERIFICAR que el host NO sea localhost en producción
if (process.env.NODE_ENV === 'production' && 
    (module.exports.host === 'localhost' || 
     module.exports.host === '127.0.0.1' || 
     module.exports.host === '0.0.0.0')) {
    throw new Error('❌ ERROR: No puedes usar localhost en producción. Configura FTP_HOST correctamente.');
}

// ✅ VERIFICAR configuración específica para tu servidor
if (module.exports.host === '10.11.20.11' && module.exports.secure === true) {
    console.warn('⚠️ ADVERTENCIA: Servidor 10.11.20.11 configurado con secure=true. ¿Estás seguro que soporta FTPS?');
}

if (module.exports.host === '10.11.20.11' && module.exports.secure === false) {
    console.log('✅ Configuración correcta para servidor 10.11.20.11 con FTP simple');
}

