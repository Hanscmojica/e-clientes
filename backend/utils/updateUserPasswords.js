const bcrypt = require('bcryptjs');
const prisma = require('../utils/prisma');

/**
 * Script para actualizar contraseñas de usuario con hash bcrypt
 * y activar usuarios para que puedan iniciar sesión
 */
async function updateUserPasswords() {
  try {
    console.log('Buscando usuarios para actualizar contraseñas...');
    
    // Obtener todos los usuarios
    const users = await prisma.BP_01_USUARIO.findMany();
    console.log(`Se encontraron ${users.length} usuarios en total.`);
    
    let updatedCount = 0;
    
    for (const user of users) {
      // Verificar si la contraseña parece ser un hash de bcrypt
      const isBcryptHash = user.sPassword && user.sPassword.startsWith('$2');
      
      if (!isBcryptHash) {
        // Generar hash para una contraseña simple '12345'
        const hashedPassword = await bcrypt.hash('12345', 10);
        
        // Actualizar el usuario
        await prisma.BP_01_USUARIO.update({
          where: { nId01Usuario: user.nId01Usuario },
          data: {
            sPassword: hashedPassword,
            bActivo: true // Activar el usuario
          }
        });
        
        console.log(`Contraseña actualizada para el usuario: ${user.sUsuario}`);
        updatedCount++;
      }
    }
    
    console.log(`Se actualizaron ${updatedCount} contraseñas.`);
    console.log('Proceso completado exitosamente.');
    
  } catch (error) {
    console.error('Error al actualizar contraseñas:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar la función
updateUserPasswords(); 