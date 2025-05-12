const apiExternaService = require("../services/apiExternaService");

const consultarApiExterna = async (req, res) => {
    const body = req.body;

    if (!body || typeof body !== 'object') {
        return res.status(400).send({ status: "Error", message: "Cuerpo inválido." });
    }

    console.log("Solicitud recibida en consultarApiExterna:", body);

    try {
        const data = await apiExternaService.consultarApiExterna(body);
        console.log("Respuesta cruda de SagaWS:", data);

        let parsedData = data;
        if (typeof data === "string") {
            try {
                parsedData = JSON.parse(data);
            } catch (e) {
                console.error("Error al parsear:", e);
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

        return res.status(200).send({
            status: "OK",
            message: "Datos obtenidos correctamente",
            data: { SDTRef: referencias } // <-- lo mantiene para compatibilidad con frontend
        });

    } catch (error) {
        console.error("Error al consultar API externa:", error);
        return res.status(500).send({
            status: "Error",
            message: error.message || "Error inesperado al obtener los datos"
        });
    }
};

module.exports = {
    consultarApiExterna
};
