// Script para listar todos los perfiles de la base de datos
const prisma = require('../utils/prisma');

async function listAllProfiles() {
  try {
    // Obtener todos los perfiles
    const perfiles = await prisma.BP_02_PERFIL.findMany({
      include: {
        perfilesUsuario: {
          include: {
            usuario: true
          }
        }
      }
    });
    
    console.log('=====================================================');
    console.log('PERFILES EN LA BASE DE DATOS:');
    console.log('=====================================================');
    
    if (perfiles.length === 0) {
      console.log('¡NO HAY PERFILES CONFIGURADOS EN LA BASE DE DATOS!');
    } else {
      perfiles.forEach(perfil => {
        console.log(`ID: ${perfil.nId02Perfil}`);
        console.log(`Nombre: ${perfil.sNombre}`);
        console.log(`Descripción: ${perfil.sDescripcion}`);
        console.log(`Fecha de creación: ${perfil.dFechaCreacion}`);
        
        // Mostrar usuarios asignados a este perfil
        console.log('Usuarios asignados:');
        if (perfil.perfilesUsuario && perfil.perfilesUsuario.length > 0) {
          perfil.perfilesUsuario.forEach(perfilUsuario => {
            const usuario = perfilUsuario.usuario;
            console.log(`  - ${usuario.sUsuario} (${usuario.sNombre} ${usuario.sApellidoPaterno})`);
          });
        } else {
          console.log('  - NINGUNO');
        }
        
        console.log('-----------------------------------------------------');
      });
    }
    
    // Mostrar la información de la relación de perfiles y usuarios
    console.log('\nRELACIONES PERFIL-USUARIO:');
    console.log('=====================================================');
    
    const relaciones = await prisma.BP_04_PERFIL_USUARIO.findMany({
      include: {
        usuario: true,
        perfil: true
      }
    });
    
    if (relaciones.length === 0) {
      console.log('¡NO HAY RELACIONES PERFIL-USUARIO EN LA BASE DE DATOS!');
    } else {
      relaciones.forEach(relacion => {
        console.log(`ID Relación: ${relacion.nId04PerfilUsuario}`);
        console.log(`Usuario: ${relacion.usuario.sUsuario} (ID: ${relacion.nId01Usuario})`);
        console.log(`Perfil: ${relacion.perfil.sNombre} (ID: ${relacion.nId02Perfil})`);
        console.log(`Fecha de asignación: ${relacion.dFechaCreacion}`);
        console.log('-----------------------------------------------------');
      });
    }
    
  } catch (error) {
    console.error('ERROR AL CONSULTAR PERFILES:', error);
  } finally {
    await prisma.$disconnect();
  }
}

listAllProfiles(); 