const db = require('../config/database');

class User {
    static async findById(id) {
        try {
            const [rows] = await db.query('SELECT * FROM BP_01_USUARIO WHERE nId01Usuario = ?', [id]);
            return rows[0];
        } catch (error) {
            throw error;
        }
    }

    static async updatePassword(id, hashedPassword) {
        try {
            const [result] = await db.query(
                'UPDATE BP_01_USUARIO SET sPassword = ?, dFechaUltimoCambioPass = NOW() WHERE nId01Usuario = ?',
                [hashedPassword, id]
            );
            return result.affectedRows > 0;
        } catch (error) {
            throw error;
        }
    }
}

module.exports = User; 