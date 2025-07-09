    const apiExternaService = require("../services/apiExternaService");

    const consultarApiExterna = async (req, res) => {
        const body = req.body;
        const user = req.user;

        // 🔍 DEBUG COMPLETO MEJORADO
        console.log("=== DEBUG COMPLETO ===");
        console.log("1. Body recibido:", body);
        console.log("2. Usuario completo:", user);
        console.log("3. user.id (ID único):", user?.id);
        console.log("4. user.idCliente (ID empresa):", user?.idCliente);
        console.log("5. user.username:", user?.username);
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

        // 🔍 LOG DETALLADO DEL USUARIO
        console.log(`🔍 USUARIO AUTENTICADO:`);
        console.log(`   - Username: ${user.username}`);
        console.log(`   - ID Usuario: ${user.id}`);
        console.log(`   - ID Cliente: ${user.idCliente}`);
        console.log(`   - Rol: ${user.role}`);

        // ✅ Inyectar el ID Cliente del usuario en la solicitud
        const bodyConIdCliente = {
            ...body,
            ClienteNo: user.idCliente
        };

        // 🔍 LOG DE LA SOLICITUD A LA API EXTERNA
        console.log(`🌐 ENVIANDO A API EXTERNA:`);
        console.log(`   - ClienteNo: ${bodyConIdCliente.ClienteNo}`);
        console.log(`   - FechaInicial: ${bodyConIdCliente.FechaInicial}`);
        console.log(`   - FechaFinal: ${bodyConIdCliente.FechaFinal}`);

        try {
            const data = await apiExternaService.consultarApiExterna(bodyConIdCliente);
            console.log(`✅ Respuesta de API externa recibida para ClienteNo ${user.idCliente}`);

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

            const referencias = Array.isArray(parsedData?.SDTRef)
                ? parsedData.SDTRef
                : (Array.isArray(parsedData) ? parsedData : []);

            // 🔍 LOG DE LAS REFERENCIAS ENCONTRADAS
            console.log(`📊 REFERENCIAS ENCONTRADAS:`);
            console.log(`   - Total: ${referencias.length}`);
            
            if (referencias.length > 0) {
                console.log(`   - Primera referencia completa:`, JSON.stringify(referencias[0], null, 2));
                
                // 🔍 BUSCAR TODOS LOS CAMPOS QUE PUEDAN INDICAR PROPIETARIO
                const primeraRef = referencias[0];
                console.log(`   - Campos sospechosos:`);
                Object.keys(primeraRef).forEach(key => {
                    const value = primeraRef[key];
                    if (typeof value === 'string' && 
                        (key.toLowerCase().includes('nombre') || 
                        key.toLowerCase().includes('client') || 
                        key.toLowerCase().includes('usuario') ||
                        key.toLowerCase().includes('propietario') ||
                        value.includes('GRISELDA') || 
                        value.includes('HANS') ||
                        value.includes('PANCHO'))) {
                        console.log(`     * ${key}: ${value}`);
                    }
                });
                
                // 🔍 MOSTRAR VARIAS REFERENCIAS PARA IDENTIFICAR PATRÓN
                if (referencias.length > 1) {
                    console.log(`   - Segunda referencia:`, JSON.stringify(referencias[1], null, 2));
                }
            }
            
            // 🔍 LOG CRÍTICO: ¿A QUIÉN PERTENECEN ESTAS REFERENCIAS?
            console.log(`🚨 VERIFICACIÓN CRÍTICA:`);
            console.log(`   - Usuario logueado: ${user.username}`);
            console.log(`   - ClienteNo enviado a API: ${bodyConIdCliente.ClienteNo}`);
            console.log(`   - ¿Las referencias pertenecen a ${user.username}?`);
            console.log(`   - Si no, hay un problema de filtrado en la API externa`);
            console.log(`=`.repeat(50));

            return res.status(200).send({
                status: "OK",
                message: "Datos obtenidos correctamente",
                debug: {
                    usuarioLogueado: user.username,
                    idUsuario: user.id,
                    clienteConsultado: user.idCliente,
                    totalReferencias: referencias.length
                },
                data: { SDTRef: referencias }
            });

        } catch (error) {
            console.error(`❌ Error al consultar API externa para ClienteNo ${user.idCliente}:`, error);
            return res.status(500).send({
                status: "Error",
                message: error.message || "Error inesperado al obtener los datos"
            });
        }
    };

    module.exports = {  
        consultarApiExterna 
    };