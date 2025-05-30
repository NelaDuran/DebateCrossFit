require('dotenv').config();
const express = require('express');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const { jsPDF } = require('jspdf');

const app = express();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Conexión a MongoDB con mejor manejo de errores
mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/debates-coaches', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000
})
.then(() => console.log('✅ Conectado a MongoDB'))
.catch(err => {
    console.error('❌ Error conectando a MongoDB:', err);
    process.exit(1);
});

// Modelo simplificado para debates
const DebateSchema = new mongoose.Schema({
    tema: { type: String, required: true },
    coach: { type: String, required: true, enum: ['CrossFit', 'HERO\'S'] },
    mensaje: { type: String, required: true },
    fecha: { type: Date, default: Date.now }
}, { collection: 'debates' });

const Debate = mongoose.model('Debate', DebateSchema);

app.use(express.static('public'));
app.use(bodyParser.json());

// Middleware para logs
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
});

// Ruta para generar respuestas
app.post('/api/generar-respuesta', async (req, res) => {
    try {
        const { tema, estilo, contexto } = req.body;
        
        if (!tema || !estilo) {
            return res.status(400).json({ error: "Faltan campos requeridos" });
        }

        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        const prompt = contexto 
            ? `Como coach ${estilo}, responde brevemente a: "${contexto}". Tema: ${tema}`
            : `Como coach ${estilo}, inicia un debate sobre: ${tema}`;

        const result = await model.generateContent(prompt);
        const text = result.response.text();
        
        res.json({ 
            success: true,
            respuesta: text 
        });
    } catch (error) {
        console.error("Error en Gemini API:", error);
        res.status(500).json({ 
            success: false,
            error: "Error generando respuesta",
            details: error.message 
        });
    }
});

// Ruta para guardar mensajes (simplificada)
app.post('/api/guardar-mensaje', async (req, res) => {
    try {
        const { tema, coach, mensaje } = req.body;
        
        if (!tema || !coach || !mensaje) {
            return res.status(400).json({ 
                success: false,
                error: "Faltan campos requeridos (tema, coach, mensaje)" 
            });
        }

        const nuevoMensaje = new Debate({ tema, coach, mensaje });
        const saved = await nuevoMensaje.save();
        
        res.json({ 
            success: true,
            debateId: saved._id,
            mensaje: 'Mensaje guardado exitosamente',
            data: saved
        });
    } catch (error) {
        console.error("Error guardando mensaje:", error);
        res.status(500).json({ 
            success: false,
            error: "Error guardando mensaje",
            details: error.message 
        });
    }
});

// Ruta para generar PDF
app.post('/api/generar-pdf', async (req, res) => {
    try {
        const { debateId } = req.body;
        
        if (!debateId) {
            return res.status(400).json({ error: "Debe proporcionar debateId" });
        }

        // Obtener todos los mensajes del debate
        const mensajes = await Debate.find({ _id: debateId }).sort({ fecha: 1 });
        
        if (!mensajes || mensajes.length === 0) {
            return res.status(404).json({ error: "Debate no encontrado" });
        }

        const doc = new jsPDF();
        const tema = mensajes[0].tema;
        
        // Encabezado
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(18);
        doc.setTextColor(40, 40, 40);
        doc.text(`Debate: ${tema}`, 105, 20, { align: 'center' });
        
        // Contenido
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        
        let y = 40;
        mensajes.forEach((msg, i) => {
            // Coach
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(msg.coach === 'CrossFit' ? '#e74c3c' : '#2ecc71');
            doc.text(`${msg.coach}:`, 20, y);
            
            // Mensaje
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(40, 40, 40);
            const lines = doc.splitTextToSize(msg.mensaje, 160);
            doc.text(lines, 30, y + 7);
            
            y += 10 + (lines.length * 7);
            
            if (y > 260 && i < mensajes.length - 1) {
                doc.addPage();
                y = 20;
            }
        });

        // Pie de página
        doc.setFontSize(10);
        doc.text(`Generado el: ${new Date().toLocaleString()}`, 105, 285, { align: 'center' });

        // Enviar PDF
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=debate-${debateId}.pdf`);
        res.send(Buffer.from(doc.output('arraybuffer')));
    } catch (error) {
        console.error("Error generando PDF:", error);
        res.status(500).json({ 
            error: "Error generando PDF",
            details: error.message 
        });
    }
});

// Ruta de verificación de salud
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK',
        mongoConnected: mongoose.connection.readyState === 1,
        uptime: process.uptime() 
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    console.log(`🔌 MongoDB: ${mongoose.connection.readyState === 1 ? 'Conectado' : 'Desconectado'}`);
});