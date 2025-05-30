require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const { jsPDF } = require('jspdf');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();

// Habilitar CORS con opciones detalladas
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Conexión a MongoDB con mejor manejo de errores
mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/debates-coaches')
.then(() => {
    console.log('✅ Conectado a MongoDB');
    console.log('📊 Estado de la conexión:', mongoose.connection.readyState);
    console.log('🔌 URL de conexión:', mongoose.connection.host);
    console.log('📁 Base de datos:', mongoose.connection.name);
})
.catch(err => {
    console.error('❌ Error conectando a MongoDB:', err);
    console.error('Stack trace:', err.stack);
    process.exit(1);
});

// Eventos de conexión MongoDB
mongoose.connection.on('error', err => {
    console.error('❌ Error en la conexión MongoDB:', err);
});

mongoose.connection.on('disconnected', () => {
    console.log('🔌 Desconectado de MongoDB');
});

mongoose.connection.on('reconnected', () => {
    console.log('🔄 Reconectado a MongoDB');
});

// Modelo simplificado para debates
const DebateSchema = new mongoose.Schema({
    tema: { type: String, required: true },
    coach: { type: String, required: true, enum: ['CrossFit', 'HEROS'] },
    mensaje: { type: String, required: true },
    fecha: { type: Date, default: Date.now }
}, { collection: 'debates' });

const Debate = mongoose.model('Debate', DebateSchema);

app.use(express.static('public'));
app.use(bodyParser.json());

// Middleware para logs detallados
app.use((req, res, next) => {
    console.log(`📥 [${new Date().toISOString()}] ${req.method} ${req.path}`);
    console.log('Headers:', req.headers);
    console.log('Body:', req.body);
    next();
});

// Configuración de Gemini
const API_KEY = 'AIzaSyBRjH2XD9hAU6is_-IenjImM5ZqYFnXP3c';
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;

// Función para generar prompt basado en el perfil del coach
function generatePrompt(tema, estilo, contexto) {
    const coachProfiles = {
        CrossFit: {
            personalidad: "apasionado y directo",
            enfoque: "resultados medibles y adaptaciones rápidas"
        },
        HEROS: {
            personalidad: "analítico y metódico",
            enfoque: "precisión técnica y progresión científica"
        }
    };

    const profile = coachProfiles[estilo];

    let promptText = `Eres un coach de ${estilo} respondiendo en un debate sobre: "${tema}".
Tu personalidad es ${profile.personalidad} y te enfocas en ${profile.enfoque}.
${contexto ? `Contexto del debate:
"${contexto}"

Responde al último mensaje de manera breve (máximo 2 oraciones) y haz una pregunta corta al otro coach.` : 'Da una opinión breve (máximo 2 oraciones) sobre el tema y haz una pregunta corta al otro coach.'}
Mantén un tono profesional pero competitivo.`;

    return promptText;
}

// Ruta para generar respuestas usando Gemini
app.post('/api/generar-respuesta', async (req, res) => {
    try {
        const { tema, estilo, contexto } = req.body;
        
        console.log('📝 Recibiendo petición para generar respuesta:', {
            tema,
            estilo,
            contexto
        });
        
        // Validación mejorada
        if (!tema || !tema.trim()) {
            return res.status(400).json({ 
                success: false,
                error: "El tema es requerido",
                received: req.body
            });
        }
        
        if (!estilo || !['CrossFit', 'HEROS'].includes(estilo)) {
            return res.status(400).json({ 
                success: false,
                error: "El estilo debe ser 'CrossFit' o 'HEROS'",
                received: req.body
            });
        }

        const promptText = generatePrompt(tema, estilo, contexto);
        
        const requestBody = {
            contents: [
                {
                    parts: [
                        {
                            text: promptText
                        }
                    ]
                }
            ]
        };

        console.log('🔄 Enviando solicitud a Gemini...');
        
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Error en Gemini API: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        
        if (!data.candidates || !data.candidates[0] || !data.candidates[0].content || !data.candidates[0].content.parts) {
            throw new Error('Respuesta inválida de Gemini API');
        }

        const respuestaTexto = data.candidates[0].content.parts[0].text;

        res.json({ 
            success: true,
            respuesta: respuestaTexto
        });
        
    } catch (error) {
        console.error("❌ Error general:", error);
        res.status(500).json({ 
            success: false,
            error: "Error generando respuesta",
            details: error.message
        });
    }
});

// Ruta para guardar mensajes
app.post('/api/guardar-mensaje', async (req, res) => {
    try {
        console.log('📝 Recibiendo petición para guardar mensaje:');
        console.log('Body:', JSON.stringify(req.body, null, 2));
        
        const { tema, coach, mensaje } = req.body;
        
        if (!tema || !coach || !mensaje) {
            console.log('❌ Faltan campos requeridos:', { tema, coach, mensaje });
            return res.status(400).json({ 
                success: false,
                error: "Faltan campos requeridos (tema, coach, mensaje)",
                received: { tema, coach, mensaje }
            });
        }

        console.log('✅ Campos validados, creando nuevo mensaje...');
        const nuevoMensaje = new Debate({ tema, coach, mensaje });
        
        console.log('💾 Guardando mensaje en MongoDB...');
        const saved = await nuevoMensaje.save();
        
        console.log('✅ Mensaje guardado exitosamente:', saved);
        res.json({ 
            success: true,
            debateId: saved._id,
            mensaje: 'Mensaje guardado exitosamente',
            data: saved
        });
    } catch (error) {
        console.error("❌ Error guardando mensaje:", error);
        console.error("Stack trace:", error.stack);
        res.status(500).json({ 
            success: false,
            error: "Error guardando mensaje",
            details: error.message,
            stack: error.stack
        });
    }
});

// Ruta para obtener mensajes
app.get('/api/mensajes/:debateId?', async (req, res) => {
    try {
        console.log('📥 Recibiendo petición para obtener mensajes');
        const { debateId } = req.params;
        
        if (!debateId || debateId === 'null') {
            console.log('🔍 Buscando todos los debates...');
            const mensajes = await Debate.find({})
                .sort({ fecha: 1 })
                .exec();

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
                ultimaFecha: mensajes[mensajes.length - 1].fecha
            }));

            debadesArray.sort((a, b) => b.ultimaFecha - a.ultimaFecha);
            
            return res.json({ 
                success: true,
                mensajes: debadesArray
            });
        }

        console.log('🔍 Buscando debate específico:', debateId);
        const mensajes = await Debate.find({ _id: debateId })
            .sort({ fecha: 1 })
            .exec();
        
        if (!mensajes || mensajes.length === 0) {
            console.log('❌ No se encontró el debate:', debateId);
            return res.status(404).json({ 
                success: false,
                error: "Debate no encontrado" 
            });
        }

        console.log('✅ Debate encontrado, enviando mensajes...');
        res.json({ 
            success: true,
            mensajes
        });
    } catch (error) {
        console.error("❌ Error obteniendo mensajes:", error);
        console.error("Stack trace:", error.stack);
        res.status(500).json({ 
            success: false,
            error: "Error obteniendo mensajes",
            details: error.message,
            stack: error.stack
        });
    }
});

// Ruta para eliminar debates
app.delete('/api/debates', async (req, res) => {
    try {
        console.log('🗑️ Eliminando todos los debates...');
        const result = await Debate.deleteMany({});
        
        console.log('✅ Debates eliminados:', result);
        res.json({ 
            success: true,
            message: 'Todos los debates han sido eliminados',
            deletedCount: result.deletedCount
        });
    } catch (error) {
        console.error("❌ Error eliminando debates:", error);
        res.status(500).json({ 
            success: false,
            error: "Error eliminando debates",
            details: error.message
        });
    }
});

// Ruta para eliminar un mensaje específico
app.delete('/api/mensajes/:mensajeId', async (req, res) => {
    try {
        const { mensajeId } = req.params;
        console.log('🗑️ Eliminando mensaje:', mensajeId);
        
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
        console.error("❌ Error eliminando mensaje:", error);
        res.status(500).json({
            success: false,
            error: "Error eliminando mensaje",
            details: error.message
        });
    }
});

// Ruta para actualizar un mensaje específico
app.put('/api/mensajes/:mensajeId', async (req, res) => {
    try {
        const { mensajeId } = req.params;
        const { mensaje } = req.body;
        
        if (!mensaje) {
            return res.status(400).json({
                success: false,
                error: "El mensaje es requerido"
            });
        }

        console.log('✏️ Actualizando mensaje:', mensajeId);
        
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
        console.error("❌ Error actualizando mensaje:", error);
        res.status(500).json({
            success: false,
            error: "Error actualizando mensaje",
            details: error.message
        });
    }
});

// Manejo de errores global
app.use((err, req, res, next) => {
    console.error('❌ Error:', err);
    res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
        details: err.message
    });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    console.log(`🔌 MongoDB: ${mongoose.connection.readyState === 1 ? 'Conectado' : 'Desconectado'}`);
});