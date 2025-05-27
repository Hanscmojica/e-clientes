const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class User {
    static async findById(id) {
        try {
            const user = await prisma.bP_01_USUARIO.findUnique({
                where: { nId01Usuario: id }
            });
            return user;
        } catch (error) {
            throw error;
        }
    }

    static async updatePassword(id, hashedPassword) {
        try {
            const result = await prisma.bP_01_USUARIO.update({
                where: { nId01Usuario: id },
                data: {
                    sPassword: hashedPassword,
                    dFechaUltimoCambioPass: new Date()
                }
            });
            return result ? true : false;
        } catch (error) {
            throw error;
        }
    }
}

module.exports = User; 