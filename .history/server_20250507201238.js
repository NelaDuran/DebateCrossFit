require('dotenv').config();
const express = require('express');
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.use(express.static('public'));

// Ruta para generar respuestas (simplificada)
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

app.listen(3000, () => console.log('Servidor en http://localhost:3000'));