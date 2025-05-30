const ftpService = require('../services/ftpService');

async function test() {
    console.log('🧪 Testing FTP...');
    const result = await ftpService.testConnection();
    console.log(result);
}

test();