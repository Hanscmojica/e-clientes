const Service = require('node-windows').Service;
const path = require('path');

const svc = new Service({
    name: 'EClientesBackend',
    description: 'Servidor backend para E-Clientes Rodall',
    script: path.join(__dirname, 'server.js'),
    env: [{
        name: "NODE_ENV",
        value: "production"
    }],
    wait: 2,
    grow: .5,
    maxRestarts: 3
});

svc.on('install', () => {
    svc.start();
    console.log('✅ Servicio instalado y iniciado');
});

svc.on('error', (err) => {
    console.error('❌ Error en el servicio:', err);
});

svc.install();