const axios = require("axios");

const consultarApiExterna = async (body) => {
  const url = "https://www.rodall.com:444/SagaWS.NetEnvironmet/rest/sagaWSRef/";

  const headers = {
    "Content-Type": "application/json",
    User: "RODALL",
    Password: "8888888888",
    "Cache-Control": "no-cache",
    Accept: "application/json",
    "Accept-Encoding": "gzip, deflate, br",
    Connection: "keep-alive",
  };

  const requestBody = {
    ...body,
    ClienteNo: body.ClienteNo || 0,
    Cliente: body.Cliente || "",
    ImportadorNo: body.ImportadorNo || 0,
    Importador: body.Importador || "",
    TipoContenedor: body.TipoContenedor || 0,
    Pedimento: body.Pedimento || 0,
    TipoContenedor2: body.TipoContenedor2 || 0,
    Estado: body.Estado || "",
    TipoFecha: body.TipoFecha || 1,
    FechaInicial: body.FechaInicial || "01/01/2022",
    FechaFinal: body.FechaFinal || "31/12/2025",
    Aduana: body.Aduana || 0,
    Operacion: body.Operacion || "",
    Buque: body.Buque || ""
  };

  console.log("Haciendo solicitud a SagaWS con body:", requestBody);

  try {
    const response = await axios.post(url, requestBody, {
      headers,
      timeout: 15000
    });

    console.log("Respuesta de SagaWS recibida. Status:", response.status);

    if (!response.data || typeof response.data !== 'object') {
      console.warn("La API devolvió una respuesta inválida:", response.data);
      return [];
    }

    console.log("Estructura de respuesta:", Object.keys(response.data));
    return response.data;

  } catch (error) {
    console.error("Error al consultar la API externa:", error.response?.data || error.message);

    if (error.code === 'ECONNABORTED') {
      throw new Error("Tiempo de espera agotado al conectar con la API externa. Intente de nuevo más tarde.");
    }

    if (!error.response) {
      throw new Error("No se pudo conectar con la API externa. Verifique su conexión a internet.");
    }

    throw new Error(`Error en la API externa: ${JSON.stringify(error.response.data || error.message)}`);
  }
};

module.exports = {
  consultarApiExterna,
};
