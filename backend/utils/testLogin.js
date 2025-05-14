// Script para probar el login directamente
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function testLogin() {
  try {
    console.log('Iniciando prueba de login...');
    
    // Credenciales de prueba
    const username = 'HANS';
    const password = '12345';
    
    console.log(`Intentando autenticar usuario: "${username}" con contraseña: "${password}"`);
    
    // Buscar usuario
    const user = await prisma.BP_01_USUARIO.findUnique({
      where: { sUsuario: username }
    });
    
    if (!user) {
      console.log(`ERROR: Usuario ${username} no encontrado en la base de datos`);
      return;
    }
    
    console.log('\nDatos del usuario encontrado:');
    console.log(`ID: ${user.nId01Usuario}`);
    console.log(`Usuario: "${user.sUsuario}" (${typeof user.sUsuario})`);
    console.log(`Nombre: ${user.sNombre} ${user.sApellidoPaterno}`);
    console.log(`Hash de Password: ${user.sPassword}`);
    console.log(`Activo: ${user.bActivo ? 'SÍ' : 'NO'}`);
    
    // Intentar comparar la contraseña
    console.log('\nVerificando contraseña...');
    const isMatch = await bcrypt.compare(password, user.sPassword);
    
    if (isMatch) {
      console.log('ÉXITO: Contraseña correcta');
    } else {
      console.log('ERROR: Contraseña incorrecta');
      
      // Crear un nuevo hash para comparar
      const salt = await bcrypt.genSalt(10);
      const newHash = await bcrypt.hash(password, salt);
      console.log(`\nNuevo hash generado para "${password}": ${newHash}`);
      console.log(`Hash actual en DB: ${user.sPassword}`);
    }
    
    // Probar actualizar la contraseña de manera directa (sin hashing)
    console.log('\nActualizando la contraseña a un valor conocido para probar...');
    const testHash = '$2a$10$qyIFUEb5G8Sp4sEPcEE6reZSWWD/0aJThtTCnrPG1AQ.ByB6TBwCK'; // Hash conocido para '12345'
    
    await prisma.BP_01_USUARIO.update({
      where: { nId01Usuario: user.nId01Usuario },
      data: {
        sPassword: testHash,
        bActivo: true
      }
    });
    
    console.log('Contraseña actualizada con un hash conocido, intenta iniciar sesión con:');
    console.log('Username: HANS');
    console.log('Password: 12345');
    
  } catch (error) {
    console.error('Error en la prueba de login:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testLogin(); 