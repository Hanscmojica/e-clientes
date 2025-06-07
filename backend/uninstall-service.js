const Service = require('node-windows').Service;
const path = require('path');

const svc = new Service({
    name: 'EClientesBackend',
    script: path.join('C:\\aplicaciones\\e-clientes\\backend\\server.js')
});

svc.on('uninstall', () => {
    console.log('Servicio desinstalado correctamente');
});

svc.uninstall();