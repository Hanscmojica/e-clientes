const apiExternaService = require("../services/apiExternaService");

const consultarApiExterna = async (req, res) => {
    const body = req.body;
    const user = req.user; // ✅ Obtener usuario del token JWT

    // 🔍 DEBUG COMPLETO
    console.log("=== DEBUG COMPLETO ===");
    console.log("1. Body recibido:", body);
    console.log("2. Usuario:", user);
    console.log("3. idCliente:", user?.idCliente);
    console.log("4. Headers:", req.headers);
    console.log("===================");

    if (!body || typeof body !== 'object') {
        console.log("❌ Body inválido");
        return res.status(400).send({ 
            status: "Error", 
            message: "Cuerpo inválido." 
        });
    }

    // ✅ Verificar que el usuario tenga ID Cliente asignado
    if (!user || !user.idCliente) {
        console.log("❌ Sin ID Cliente:", user);
        return res.status(403).send({
            status: "Error",
            message: "Usuario no tiene ID Cliente asignado. Contacte al administrador."
        });
    }

    console.log("✅ Verificaciones pasadas, procediendo...");

    // ✅ Log con información del usuario autenticado
    console.log(`🔍 Usuario: ${user.username} | ID Cliente: ${user.idCliente}`);
    console.log("📝 Solicitud recibida:", {
        usuario: user.username,
        idCliente: user.idCliente,
        fechaInicial: body.FechaInicial,
        fechaFinal: body.FechaFinal,
        otrosParametros: Object.keys(body).filter(k => !['FechaInicial', 'FechaFinal'].includes(k))
    });

    // ✅ Inyectar el ID Cliente del usuario en la solicitud
    const bodyConIdCliente = {
        ...body,
        ClienteNo: user.idCliente  // ✅ Usar ID Cliente dinámico del usuario
    };

    try {
        const data = await apiExternaService.consultarApiExterna(bodyConIdCliente);
        console.log(`✅ Respuesta de SagaWS recibida para cliente ${user.idCliente}`);

        let parsedData = data;
        if (typeof data === "string") {
            try {
                parsedData = JSON.parse(data);
            } catch (e) {
                console.error("❌ Error al parsear JSON:", e);
                return res.status(500).send({
                    status: "Error",
                    message: "La respuesta no es JSON válido."
                });
            }
        }

        // ✅ Usar SDTRef como fuente real de datos
        const referencias = Array.isArray(parsedData?.SDTRef)
            ? parsedData.SDTRef
            : (Array.isArray(parsedData) ? parsedData : []);

        console.log(`📊 ${referencias.length} referencias encontradas para cliente ${user.idCliente}`);

        return res.status(200).send({
            status: "OK",
            message: "Datos obtenidos correctamente",
            usuario: user.username,          // ✅ Información del usuario
            clienteId: user.idCliente,       // ✅ ID Cliente usado
            total: referencias.length,       // ✅ Total de referencias
            data: { SDTRef: referencias }    // ✅ Mantener compatibilidad con frontend
        });

    } catch (error) {
        console.error(`❌ Error al consultar API externa para cliente ${user.idCliente}:`, error);
        return res.status(500).send({
            status: "Error",
            message: error.message || "Error inesperado al obtener los datos"
        });
    }
};

module.exports = {
    consultarApiExterna
};