import { GoogleGenerativeAI } from "@google/generative-ai";

// 1. Configuración
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// 2. Selecciona el modelo (gemini-pro para texto)
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

// 3. Función para generar respuestas
async function generarRespuesta(prompt) {
    const result = await model.generateContent(prompt);
    return result.response.text();
}

// Ejemplo de uso
const respuesta = await generarRespuesta(
    "Como coach deportivo, ¿cómo mejorar el rendimiento en un equipo de fútbol juvenil?"
);
console.log(respuesta);