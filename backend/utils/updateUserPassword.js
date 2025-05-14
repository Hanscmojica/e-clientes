// Script para actualizar la contraseña de un usuario existente
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function updateUserPassword() {
  try {
    // Generar hash de la contraseña - usemos una contraseña sencilla para pruebas
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('12345', salt);

    // Buscar al usuario por su nombre de usuario (usando el que vemos en la base de datos)
    const user = await prisma.BP_01_USUARIO.findUnique({
      where: { sUsuario: 'HANS' }
    });

    if (!user) {
      console.log('Usuario HANS no encontrado');
      return;
    }

    // Actualizar la contraseña
    await prisma.BP_01_USUARIO.update({
      where: { nId01Usuario: user.nId01Usuario },
      data: {
        sPassword: hashedPassword,
        bActivo: true, // Asegurarnos que esté activo
        dFechaActualizacion: new Date()
      }
    });

    console.log(`Contraseña actualizada para usuario ${user.sUsuario} (ID: ${user.nId01Usuario})`);
    console.log('Ahora puedes iniciar sesión con:');
    console.log('Usuario: HANS');
    console.log('Contraseña: 12345');
  } catch (error) {
    console.error('Error al actualizar la contraseña:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateUserPassword(); 