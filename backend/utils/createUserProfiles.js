const prisma = require('../utils/prisma');

/**
 * Script para crear perfiles de usuario en la tabla BP_04_PERFIL_USUARIO
 * Esto permitirá a los usuarios existentes iniciar sesión
 */
async function createUserProfiles() {
  try {
    console.log('Buscando usuarios sin perfil asignado...');
    
    // 1. Buscar todos los usuarios activos
    const users = await prisma.BP_01_USUARIO.findMany({
      where: { 
        bActivo: true 
      },
      include: {
        perfilesUsuario: true
      }
    });
    
    console.log(`Se encontraron ${users.length} usuarios activos.`);
    
    // 2. Verificar si existe al menos un perfil en la tabla BP_02_PERFIL
    const perfiles = await prisma.BP_02_PERFIL.findMany();
    
    if (perfiles.length === 0) {
      console.log('No hay perfiles en la base de datos. Creando perfil ADMIN...');
      
      // Crear perfil ADMIN si no existe
      const adminPerfil = await prisma.BP_02_PERFIL.create({
        data: {
          sNombre: 'ADMIN',
          sDescripcion: 'Administrador del sistema',
          dFechaCreacion: new Date()
        }
      });
      
      console.log(`Perfil ADMIN creado con ID: ${adminPerfil.nId02Perfil}`);
      perfiles.push(adminPerfil);
    }
    
    // 3. Asignar el primer perfil disponible a todos los usuarios que no tienen perfil
    let assignedCount = 0;
    
    for (const user of users) {
      // Si el usuario no tiene perfil, asignarle uno
      if (user.perfilesUsuario.length === 0) {
        await prisma.BP_04_PERFIL_USUARIO.create({
          data: {
            nId01Usuario: user.nId01Usuario,
            nId02Perfil: perfiles[0].nId02Perfil,
            dFechaCreacion: new Date()
          }
        });
        
        console.log(`Perfil asignado al usuario: ${user.sUsuario}`);
        assignedCount++;
      }
    }
    
    console.log(`Se asignaron perfiles a ${assignedCount} usuarios.`);
    console.log('Proceso completado exitosamente.');
    
  } catch (error) {
    console.error('Error al crear perfiles de usuario:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar la función
createUserProfiles(); 