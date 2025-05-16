const prisma = require('../utils/prisma');

async function setupRolesAndPermissions() {
    try {
        // 1. Crear Perfiles
        const perfiles = [
            {
                nombre: 'ADMIN',
                descripcion: 'Administrador del sistema con acceso total'
            },
            {
                nombre: 'CLIENTE',
                descripcion: 'Usuario cliente con acceso limitado a sus documentos'
            },
            {
                nombre: 'EJECUTIVO_CUENTA',
                descripcion: 'Ejecutivo que puede gestionar cuentas de clientes'
            },
            {
                nombre: 'ADMIN_CLIENTE',
                descripcion: 'Administrador de cliente con acceso a gestión de usuarios'
            }
        ];

        // 2. Crear Permisos
        const permisos = [
            {
                nombre: 'BIBLIOTECA_PDF',
                descripcion: 'Acceso a documentos PDF en biblioteca'
            },
            {
                nombre: 'GESTION_USUARIOS',
                descripcion: 'Gestión de usuarios y permisos'
            },
            {
                nombre: 'ACCESO_CUENTA_CLIENTE',
                descripcion: 'Acceso a cuentas de clientes (para ejecutivos)'
            }
        ];

        console.log('Creando perfiles...');
        // Crear perfiles
        for (const perfil of perfiles) {
            await prisma.BP_02_PERFIL.upsert({
                where: { sNombre: perfil.nombre },
                update: {},
                create: {
                    sNombre: perfil.nombre,
                    sDescripcion: perfil.descripcion,
                    dFechaCreacion: new Date()
                }
            });
        }

        console.log('Creando permisos...');
        // Crear permisos
        for (const permiso of permisos) {
            await prisma.BP_03_PERMISO.upsert({
                where: { sNombre: permiso.nombre },
                update: {},
                create: {
                    sNombre: permiso.nombre,
                    sDescripcion: permiso.descripcion,
                    dFechaCreacion: new Date()
                }
            });
        }

        // Obtener IDs de perfiles y permisos
        const perfilesDB = await prisma.BP_02_PERFIL.findMany();
        const permisosDB = await prisma.BP_03_PERMISO.findMany();

        console.log('Configurando permisos para cada perfil...');
        // Configurar permisos para cada perfil
        const perfilPermisos = [
            // ADMIN tiene todos los permisos
            ...permisosDB.map(permiso => ({
                perfilNombre: 'ADMIN',
                permisoNombre: permiso.sNombre,
                leer: true,
                crear: true,
                editar: true,
                borrar: true
            })),
            // CLIENTE solo puede leer PDFs
            {
                perfilNombre: 'CLIENTE',
                permisoNombre: 'BIBLIOTECA_PDF',
                leer: true,
                crear: false,
                editar: false,
                borrar: false
            },
            // EJECUTIVO_CUENTA puede acceder a cuentas de clientes y leer PDFs
            {
                perfilNombre: 'EJECUTIVO_CUENTA',
                permisoNombre: 'BIBLIOTECA_PDF',
                leer: true,
                crear: false,
                editar: false,
                borrar: false
            },
            {
                perfilNombre: 'EJECUTIVO_CUENTA',
                permisoNombre: 'ACCESO_CUENTA_CLIENTE',
                leer: true,
                crear: false,
                editar: true,
                borrar: false
            },
            // ADMIN_CLIENTE puede gestionar usuarios y acceder a PDFs
            {
                perfilNombre: 'ADMIN_CLIENTE',
                permisoNombre: 'BIBLIOTECA_PDF',
                leer: true,
                crear: true,
                editar: true,
                borrar: true
            },
            {
                perfilNombre: 'ADMIN_CLIENTE',
                permisoNombre: 'GESTION_USUARIOS',
                leer: true,
                crear: true,
                editar: true,
                borrar: true
            }
        ];

        // Asignar permisos a perfiles
        for (const pp of perfilPermisos) {
            const perfil = perfilesDB.find(p => p.sNombre === pp.perfilNombre);
            const permiso = permisosDB.find(p => p.sNombre === pp.permisoNombre);

            if (perfil && permiso) {
                // Primero buscar si ya existe la relación
                const existingPermission = await prisma.BP_05_PERFIL_PERMISO.findFirst({
                    where: {
                        nId02Perfil: perfil.nId02Perfil,
                        nId03Permiso: permiso.nId03Permiso
                    }
                });

                if (existingPermission) {
                    // Actualizar si existe
                    await prisma.BP_05_PERFIL_PERMISO.update({
                        where: {
                            nId05PerfilPermiso: existingPermission.nId05PerfilPermiso
                        },
                        data: {
                            nLeer: pp.leer,
                            nCrear: pp.crear,
                            nEditar: pp.editar,
                            nBorrar: pp.borrar,
                            dFechaActualizacion: new Date()
                        }
                    });
                } else {
                    // Crear si no existe
                    await prisma.BP_05_PERFIL_PERMISO.create({
                        data: {
                            nId02Perfil: perfil.nId02Perfil,
                            nId03Permiso: permiso.nId03Permiso,
                            nLeer: pp.leer,
                            nCrear: pp.crear,
                            nEditar: pp.editar,
                            nBorrar: pp.borrar,
                            dFechaCreacion: new Date()
                        }
                    });
                }
            }
        }

        console.log('Configuración de roles y permisos completada exitosamente');

    } catch (error) {
        console.error('Error al configurar roles y permisos:', error);
        throw error; // Relanzar el error para que sea manejado por el llamador
    } finally {
        await prisma.$disconnect();
    }
}

module.exports = setupRolesAndPermissions;

// Si se ejecuta directamente
if (require.main === module) {
    setupRolesAndPermissions()
        .then(() => console.log('Proceso completado'))
        .catch(error => {
            console.error('Error:', error);
            process.exit(1);
        });
} 