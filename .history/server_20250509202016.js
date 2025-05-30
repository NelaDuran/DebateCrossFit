require('dotenv').config();
const express = require('express');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

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
    tema: String,
    respuestaCrossFit: String,
    respuestaHeros: String,
    fecha: { type: Date, default: Date.now }
});
const Debate = mongoose.model('Debate', DebateSchema);

app.use(express.static('public'));
app.use(bodyParser.json());

// Ruta para generar respuestas
app.post('/api/generar-respuesta', async (req, res) => {
    const { tema, estilo } = req.body;

    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const prompt = `Como coach ${estilo}, responde brevemente (máx 2 líneas) sobre: ${tema}`;

    try {
        const result = await model.generateContent(prompt);
        res.json({ respuesta: result.response.text() });
    } catch (error) {
        res.status(500).json({ error: "Error en Gemini API" });
    }
});

// Ruta para guardar debates
app.post('/api/guardar-debate', async (req, res) => {
    const { tema, respuestaCrossFit, respuestaHeros } = req.body;

    try {
        const nuevoDebate = new Debate({ tema, respuestaCrossFit, respuestaHeros });
        await nuevoDebate.save();
        res.json({ mensaje: 'Debate guardado exitosamente', debate: nuevoDebate });
    } catch (error) {
        res.status(500).json({ error: "Error guardando en MongoDB" });
    }
});

// Ruta para obtener todos los debates
app.get('/api/debates', async (req, res) => {
    try {
        const debates = await Debate.find().sort({ fecha: -1 });
        res.json(debates);
    } catch (error) {
        res.status(500).json({ error: "Error obteniendo debates" });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor en http://localhost:${PORT}`));