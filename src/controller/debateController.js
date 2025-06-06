const fetch = require("node-fetch");
const bodyParser = require("body-parser");
const Debate = require("../model/debateModel");
const db = require("../database/db");

const API_KEY = process.env.GEMINI_API_KEY;
const API_URL = process.env.URL + API_KEY;

function generatePrompt(tema, estilo, contexto) {
  const coachProfiles = {
    CrossFit: {
      personalidad: "apasionado y directo",
      enfoque: "resultados medibles y adaptaciones rápidas",
    },
    HEROS: {
      personalidad: "analítico y metódico",
      enfoque: "precisión técnica y progresión científica",
    },
  };

  const profile = coachProfiles[estilo];

  let promptText = `Eres un coach de ${estilo} respondiendo en un debate sobre: "${tema}".
Tu personalidad es ${profile.personalidad} y te enfocas en ${profile.enfoque}.
${
  contexto
    ? `Contexto del debate:
"${contexto}"

Responde al último mensaje de manera breve (máximo 2 oraciones) y haz una pregunta corta al otro coach.`
    : "Da una opinión breve (máximo 2 oraciones) sobre el tema y haz una pregunta corta al otro coach."
}
Mantén un tono profesional pero competitivo.`;

  return promptText;
}

async function generarRespuesta(req, res) {
  try {
    const { tema, estilo, contexto } = req.body;

    if (!tema || !tema.trim()) {
      return res.status(400).json({
        success: false,
        error: "El tema es requerido",
        received: req.body,
      });
    }

    if (!estilo || !["CrossFit", "HEROS"].includes(estilo)) {
      return res.status(400).json({
        success: false,
        error: "El estilo debe ser 'CrossFit' o 'HEROS'",
        received: req.body,
      });
    }

    const promptText = generatePrompt(tema, estilo, contexto);

    const requestBody = {
      contents: [
        {
          parts: [
            {
              text: promptText,
            },
          ],
        },
      ],
    };

    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error en Gemini API: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    if (
      !data.candidates ||
      !data.candidates[0] ||
      !data.candidates[0].content ||
      !data.candidates[0].content.parts
    ) {
      throw new Error("Respuesta inválida de Gemini API");
    }

    const respuestaTexto = data.candidates[0].content.parts[0].text;

    res.json({
      success: true,
      respuesta: respuestaTexto,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Error generando respuesta",
      details: error.message,
    });
  }
}

async function guardarMensaje(req, res) {
  try {
    await db.connect();
    const { tema, coach, mensaje } = req.body;

    if (!tema || !coach || !mensaje) {
      return res.status(400).json({
        success: false,
        error: "Faltan campos requeridos (tema, coach, mensaje)",
        received: { tema, coach, mensaje },
      });
    }
    const nuevoMensaje = new Debate({ tema, coach, mensaje });
    const saved = await nuevoMensaje.save();

    res.json({
      success: true,
      debateId: saved._id,
      mensaje: "Mensaje guardado exitosamente",
      data: saved,
    });
  } catch (error) {
    console.error("Stack trace:", error.stack);
    res.status(500).json({
      success: false,
      error: "Error guardando mensaje",
      details: error.message,
      stack: error.stack,
    });
  }
}

async function obtenerMensajes(req, res) {
  try {
    await db.connect();
    const { debateId } = req.params;

    if (!debateId || debateId === "null") {
      const mensajes = await Debate.find({}).sort({ fecha: 1 }).exec();

      const debates = mensajes.reduce((acc, msg) => {
        if (!acc[msg.tema]) {
          acc[msg.tema] = [];
        }
        acc[msg.tema].push(msg);
        return acc;
      }, {});

      const debadesArray = Object.entries(debates).map(([tema, mensajes]) => ({
        tema,
        mensajes,
        ultimaFecha: mensajes[mensajes.length - 1].fecha,
      }));

      debadesArray.sort((a, b) => b.ultimaFecha - a.ultimaFecha);

      return res.json({
        success: true,
        mensajes: debadesArray,
      });
    }

    const mensajes = await Debate.find({ _id: debateId })
      .sort({ fecha: 1 })
      .exec();

    if (!mensajes || mensajes.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Debate no encontrado",
      });
    }

    res.json({
      success: true,
      mensajes,
    });
  } catch (error) {
    console.error("Stack trace:", error.stack);
    res.status(500).json({
      success: false,
      error: "Error obteniendo mensajes",
      details: error.message,
      stack: error.stack,
    });
  }
}

async function eliminarDebates(req, res) {
  try {
    await db.connect();
    const result = await Debate.deleteMany({});

    res.json({
      success: true,
      message: "Todos los debates han sido eliminados",
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Error eliminando debates",
      details: error.message,
    });
  }
}

async function eliminarMensajePorId(req, res){
    try {
        await db.connect();
        const { mensajeId } = req.params;
        
        const resultado = await Debate.findByIdAndDelete(mensajeId);
        if (!resultado) {
            return res.status(404).json({
                success: false,
                error: "Mensaje no encontrado"
            });
        }
        
        res.json({
            success: true,
            message: 'Mensaje eliminado exitosamente'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: "Error eliminando mensaje",
            details: error.message
        });
    }
}

async function actualizarMensaje(req, res){
    try {
        await db.connect();
        const { mensajeId } = req.params;
        const { mensaje } = req.body;
        
        if (!mensaje) {
            return res.status(400).json({
                success: false,
                error: "El mensaje es requerido"
            });
        }
        const mensajeActualizado = await Debate.findByIdAndUpdate(
            mensajeId,
            { mensaje },
            { new: true }
        );

        if (!mensajeActualizado) {
            return res.status(404).json({
                success: false,
                error: "Mensaje no encontrado"
            });
        }
        
        res.json({
            success: true,
            mensaje: mensajeActualizado
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: "Error actualizando mensaje",
            details: error.message
        });
    }
}

module.exports = {
  generarRespuesta,
  guardarMensaje,
  obtenerMensajes,
  eliminarDebates,
  eliminarMensajePorId,
  actualizarMensaje
};
