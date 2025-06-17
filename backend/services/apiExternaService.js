const axios = require("axios");

// 🚀 CATÁLOGO DE ESTADOS - AGREGADO
const CATALOGO_ESTADOS = {
  "U": "ANTICIPO RECIBIDO",
  "5": "ASESORIA",
  "M": "AVERIA DEL VEHICULO",
  "3": "CLASIFICADO",
  "!": "COVE GENERADO",
  "@": "COVE REALIZADO",
  "1": "CUENTA DE GASTOS",
  "K": "DESADUANADO O DESPACHADO",
  "Y": "DESPACHADO - LIBRE",
  "Z": "DESPACHADO C/ RECONOCIMIENTO",
  "8": "DESPACHADO DESCAMEX",
  "7": "DESPACHADO LAG",
  "X": "EN ABANDONO",
  "A": "EN ESPERA DE ANTICIPOS",
  "L": "EN RUTA",
  "6": "ETIQUETADO",
  "P": "FALTA CARTA VACIOS",
  "O": "FALTA TALON FLETE",
  "B": "FALTAN DOCUMENTOS",
  "H": "HOY",
  "9": "JURIDICO",
  "J": "MERCANCIA CARGADA",
  "N": "MERCANCIA ENTREGADA",
  "T": "OPERACION TERMINADA",
  "Q": "OTROS (SE ESPECIFICA)",
  "I": "POR CLASIFICAR",
  "W": "POR DESPACHAR",
  "F": "POR FACTURARSE",
  "C": "POR REVALIDAR",
  "G": "PREVIO CONCLUIDO",
  "#": "PROFORMA DE COVE",
  "R": "PROFORMA DE FACTURA",
  "4": "PROFORMA PEDIMENTO",
  "S": "PROFORMA REVISADA",
  "E": "PROGRAMADO A PREVIO",
  "D": "REVALIDADO",
  "2": "SE REGRESA A EJECUTIVA",
  "V": "VALIDADO"
};

// 🚀 FUNCIÓN PARA ENRIQUECER HISTORIAL - AGREGADA
function enriquecerHistorialConDescripciones(respuestaSAGA) {
  try {
    console.log("Enriqueciendo historial con descripciones de estados...");
    
    // Verificar si hay datos
    if (!respuestaSAGA || !respuestaSAGA.data || !respuestaSAGA.data.SDTRef) {
      console.log("No hay datos para enriquecer");
      return respuestaSAGA;
    }

    let estadosEncontrados = new Set();
    let estadosEnriquecidos = 0;

    // Procesar cada referencia
    respuestaSAGA.data.SDTRef.forEach((referencia, refIndex) => {
      // Si la referencia tiene historial
      if (referencia.Historial && Array.isArray(referencia.Historial)) {
        referencia.Historial.forEach((evento, eventoIndex) => {
          // Si el evento tiene estado
          if (evento.Estado) {
            estadosEncontrados.add(evento.Estado);
            
            // Agregar descripción del estado
            const descripcion = CATALOGO_ESTADOS[evento.Estado] || `ESTADO DESCONOCIDO (${evento.Estado})`;
            evento.DescripcionEstado = descripcion;
            
            // Agregar estado completo para mostrar en frontend
            evento.EstadoCompleto = `${evento.Estado} - ${descripcion}`;
            
            estadosEnriquecidos++;
            
            console.log(`Ref ${refIndex}, Evento ${eventoIndex}: Estado "${evento.Estado}" → "${descripcion}"`);
          }
        });
      }
    });

    console.log(`✅ Estados enriquecidos: ${estadosEnriquecidos}`);
    console.log(`📊 Estados únicos encontrados: [${Array.from(estadosEncontrados).join(', ')}]`);

    return respuestaSAGA;
    
  } catch (error) {
    console.error('❌ Error enriqueciendo historial:', error);
    return respuestaSAGA; // Devolver original si hay error
  }
}

// 🚀 FUNCIÓN PRINCIPAL - MODIFICADA PARA INCLUIR ENRIQUECIMIENTO
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
    
    // 🚀 AQUÍ ES DONDE ENRIQUECEMOS LA RESPUESTA ANTES DE DEVOLVERLA
    const respuestaEnriquecida = enriquecerHistorialConDescripciones(response.data);
    
    console.log("✅ Respuesta enriquecida con descripciones de estados");
    
    return respuestaEnriquecida;

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