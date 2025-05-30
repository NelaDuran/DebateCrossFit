import fetch from 'node-fetch';

async function testGeminiConnection() {
    try {
        console.log('Iniciando prueba de conexión con Gemini...');
        
        const API_KEY = 'AIzaSyBRjH2XD9hAU6is_-IenjImM5ZqYFnXP3c';
        const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;

        const requestBody = {
            contents: [
                {
                    parts: [
                        {
                            text: "Explain how AI works in a few words"
                        }
                    ]
                }
            ]
        };

        console.log('🔄 Enviando solicitud a Gemini...');
        console.log('URL:', API_URL);
        console.log('Body:', JSON.stringify(requestBody, null, 2));
        
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
        });

        const responseText = await response.text();
        console.log('Respuesta completa:', responseText);

        if (!response.ok) {
            throw new Error(`Error HTTP ${response.status}: ${responseText}`);
        }

        const data = JSON.parse(responseText);
        console.log('✅ Respuesta recibida de Gemini:', JSON.stringify(data, null, 2));
        
    } catch (error) {
        console.error('❌ Error en la prueba:', error.message);
        console.error('Detalles completos del error:', error);
    }
}

testGeminiConnection(); 