// Script para listar todos los usuarios de la base de datos
const prisma = require('../utils/prisma');

async function listAllUsers() {
  try {
    // Obtener todos los usuarios con sus perfiles
    const users = await prisma.BP_01_USUARIO.findMany({
      include: {
        perfilesUsuario: {
          include: {
            perfil: true
          }
        }
      }
    });
    
    console.log('=====================================================');
    console.log('USUARIOS EN LA BASE DE DATOS:');
    console.log('=====================================================');
    
    if (users.length === 0) {
      console.log('¡NO HAY USUARIOS EN LA BASE DE DATOS!');
    } else {
      users.forEach(user => {
        console.log(`ID: ${user.nId01Usuario}`);
        console.log(`Nombre: ${user.sNombre} ${user.sApellidoPaterno} ${user.sApellidoMaterno}`);
        console.log(`Usuario: "${user.sUsuario}"`); // Entre comillas para ver espacios
        console.log(`Email: ${user.sEmail}`);
        console.log(`Password: ${user.sPassword.substring(0, 20)}... (hash)`);
        console.log(`Activo: ${user.bActivo ? 'SÍ' : 'NO'}`);
        
        // Mostrar perfiles del usuario
        console.log('Perfiles asignados:');
        if (user.perfilesUsuario && user.perfilesUsuario.length > 0) {
          user.perfilesUsuario.forEach(perfilUsuario => {
            if (perfilUsuario.perfil) {
              console.log(`  - ${perfilUsuario.perfil.sNombre}: ${perfilUsuario.perfil.sDescripcion}`);
            } else {
              console.log(`  - ID de perfil: ${perfilUsuario.nId02Perfil} (Datos no disponibles)`);
            }
          });
        } else {
          console.log('  - NINGUNO');
        }
        
        console.log('-----------------------------------------------------');
      });
    }
    
    // Mostrar también la información de la conexión a la base de datos
    const databaseUrl = process.env.DATABASE_URL || 'No configurada';
    console.log('\nCONFIGURACIÓN DE BASE DE DATOS:');
    console.log('-----------------------------------------------------');
    console.log(`DATABASE_URL: ${databaseUrl}`);
    console.log('=====================================================');
    
    // Mostrar también los perfiles disponibles en el sistema
    console.log('\nPERFILES DISPONIBLES EN EL SISTEMA:');
    console.log('=====================================================');
    
    try {
      const perfiles = await prisma.BP_02_PERFIL.findMany();
      
      if (perfiles.length === 0) {
        console.log('¡NO HAY PERFILES CONFIGURADOS!');
      } else {
        perfiles.forEach(perfil => {
          console.log(`ID: ${perfil.nId02Perfil}`);
          console.log(`Nombre: ${perfil.sNombre}`);
          console.log(`Descripción: ${perfil.sDescripcion}`);
          console.log('-----------------------------------------------------');
        });
      }
    } catch (error) {
      console.error('ERROR AL CONSULTAR PERFILES:', error);
    }
    
  } catch (error) {
    console.error('ERROR AL CONSULTAR USUARIOS:', error);
  } finally {
    await prisma.$disconnect();
  }
}

listAllUsers(); 