require('dotenv').config();
const express = require('express');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const { jsPDF } = require('jspdf');

const app = express();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Conexión a MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/debates-coaches', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('Conectado a MongoDB'))
.catch(err => console.error('Error conectando a MongoDB:', err));

// Modelo para debates
const DebateSchema = new mongoose.Schema({
    conversacion: [{
        coach: String,
        mensaje: String,
        timestamp: { type: Date, default: Date.now }
    }],
    tema: String,
    fecha: { type: Date, default: Date.now }
});
const Debate = mongoose.model('Debate', DebateSchema);

app.use(express.static('public'));
app.use(bodyParser.json());

// Ruta para generar respuestas
app.post('/api/generar-respuesta', async (req, res) => {
    const { tema, estilo, contexto } = req.body;

    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const prompt = contexto 
        ? `Como coach ${estilo}, responde brevemente (1-2 líneas) a esto: "${contexto}". Tema: ${tema}`
        : `Como coach ${estilo}, inicia un debate breve (1-2 líneas) sobre: ${tema}`;

    try {
        const result = await model.generateContent(prompt);
        res.json({ respuesta: result.response.text() });
    } catch (error) {
        console.error("Error en Gemini API:", error);
        res.status(500).json({ error: "Error en Gemini API" });
    }
});

// Ruta para guardar debates
app.post('/api/guardar-mensaje', async (req, res) => {
    const { tema, coach, mensaje, debateId } = req.body;

    try {
        let debate;
        if (debateId) {
            debate = await Debate.findById(debateId);
            debate.conversacion.push({ coach, mensaje });
        } else {
            debate = new Debate({
                tema,
                conversacion: [{ coach, mensaje }]
            });
        }
        
        await debate.save();
        res.json({ 
            mensaje: 'Mensaje guardado exitosamente', 
            debate: debate,
            debateId: debate._id 
        });
    } catch (error) {
        console.error("Error guardando en MongoDB:", error);
        res.status(500).json({ error: "Error guardando en MongoDB" });
    }
});

// Ruta para generar PDF
app.post('/api/generar-pdf', async (req, res) => {
    const { debateId } = req.body;

    try {
        const debate = await Debate.findById(debateId);
        if (!debate) {
            return res.status(404).json({ error: "Debate no encontrado" });
        }

        const doc = new jsPDF();
        
        // Estilo del PDF
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(18);
        doc.text(`Debate: ${debate.tema}`, 105, 20, { align: 'center' });
        
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        
        let y = 40;
        debate.conversacion.forEach((mensaje, index) => {
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(mensaje.coach === 'CrossFit' ? '#e74c3c' : '#2ecc71');
            doc.text(`${mensaje.coach}:`, 20, y);
            
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(0, 0, 0); // Negro
            doc.text(mensaje.mensaje, 30, y + 7, { maxWidth: 160 });
            
            y += 20;
            if (y > 260) { // Nueva página si se llena
                doc.addPage();
                y = 20;
            }
        });

        // Fecha
        doc.setFontSize(10);
        doc.text(`Generado el: ${new Date().toLocaleString()}`, 105, 285, { align: 'center' });

        // Enviar PDF
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=debate-${debateId}.pdf`);
        res.send(Buffer.from(doc.output('arraybuffer')));
    } catch (error) {
        console.error("Error generando PDF:", error);
        res.status(500).json({ error: "Error generando PDF" });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor en http://localhost:${PORT}`));