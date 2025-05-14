// Script para crear un usuario de prueba en la base de datos
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function createTestUser() {
  try {
    // Generar hash de la contraseña
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('HANS', salt);

    // Verificar si el usuario ya existe
    const existingUser = await prisma.BP_01_USUARIO.findUnique({
      where: { sUsuario: 'hans' }
    });

    if (existingUser) {
      console.log('El usuario ya existe, actualizando contraseña...');
      await prisma.BP_01_USUARIO.update({
        where: { nId01Usuario: existingUser.nId01Usuario },
        data: {
          sPassword: hashedPassword,
          dFechaActualizacion: new Date()
        }
      });
      console.log('Contraseña actualizada correctamente');
    } else {
      // Crear el usuario
      const newUser = await prisma.BP_01_USUARIO.create({
        data: {
          sNombre: 'Hans',
          sApellidoPaterno: 'Mojica',
          sApellidoMaterno: '',
          sUsuario: 'hans',
          sEmail: 'hans@hotmail.com',
          sPassword: hashedPassword,
          bActivo: true,
          dFechaCreacion: new Date()
        }
      });

      console.log('Usuario creado correctamente:', newUser.nId01Usuario);

      // Crear un perfil ADMIN si no existe
      let adminPerfil = await prisma.BP_02_PERFIL.findUnique({
        where: { sNombre: 'ADMIN' }
      });

      if (!adminPerfil) {
        adminPerfil = await prisma.BP_02_PERFIL.create({
          data: {
            sNombre: 'ADMIN',
            sDescripcion: 'Administrador del sistema',
            dFechaCreacion: new Date()
          }
        });
        console.log('Perfil ADMIN creado');
      }

      // Asignar el perfil al usuario
      await prisma.BP_04_PERFIL_USUARIO.create({
        data: {
          nId01Usuario: newUser.nId01Usuario,
          nId02Perfil: adminPerfil.nId02Perfil,
          dFechaCreacion: new Date()
        }
      });

      console.log('Perfil asignado al usuario');
    }

    console.log('Proceso completado correctamente');
  } catch (error) {
    console.error('Error al crear usuario de prueba:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser(); 