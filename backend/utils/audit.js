const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function logAudit({ userId, username, event, ip, details }) {
  try {
    await prisma.auditLog.create({
      data: { userId, username, event, ip, details }
    });
  } catch (err) {
    // Si falla, solo muestra el error (no interrumpe el flujo)
    console.error('Error al guardar en bitácora:', err);
  }
}

module.exports = { logAudit };