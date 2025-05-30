document.getElementById('btn-generar').addEventListener('click', async () => {
    const debateTable = document.getElementById('debate-table');

    // Limpiamos filas anteriores (excepto cabecera)
    while (debateTable.rows.length > 1) {
        debateTable.deleteRow(1);
    }

    // Temas de debate para coaches
    const temas = [
        "¿Es mejor un enfoque ofensivo o defensivo en fútbol juvenil?",
        "¿Deben los jugadores especializarse en una posición desde jóvenes?",
        "¿Cuántas horas de entrenamiento son ideales para adolescentes?"
    ];

    for (const tema of temas) {
        // Simulamos debate con Gemini (en un caso real, llamarías a tu API)
        const respuestaOfensivo = await mockGeminiResponse(tema, "ofensivo");
        const respuestaDefensivo = await mockGeminiResponse(tema, "defensivo");

        // Añadimos filas al debate
        addDebateRow(tema, respuestaOfensivo, respuestaDefensivo);
    }
});

// Función mock para simular Gemini (reemplazar con llamada real a tu API)
async function mockGeminiResponse(tema, estilo) {
    const respuestas = {
        ofensivo: [
            "Como coach ofensivo, creo en la presión constante al rival. Ejemplo: el 'Gegenpressing' del Liverpool.",
            "La creatividad en ataque es clave. Jugadores como Messi demuestran que el riesgo vale la pena.",
            "Prefiero ganar 4-3 que empatar 0-0. El espectáculo atrae aficionados."
        ],
        defensivo: [
            "Una buena defensa gana campeonatos. Equipos como el Atlético de Madrid lo demuestran.",
            "Sin orden defensivo, no hay ataque efectivo. Primero hay que ser sólidos atrás.",
            "La paciencia es virtud. Un error defensivo puede costar el partido."
        ]
    };

    // Simulamos delay de API
    await new Promise(resolve => setTimeout(resolve, 800));
    return respuestas[estilo][Math.floor(Math.random() * respuestas[estilo].length)];
}

function addDebateRow(tema, respuestaOfensivo, respuestaDefensivo) {
    const row = document.getElementById('debate-table').insertRow();

    const cellTema = row.insertCell(0);
    const cellRespuesta = row.insertCell(1);

    cellTema.innerHTML = `<strong>Tema:</strong> ${tema}<br><br>${respuestaOfensivo}`;
    cellRespuesta.innerHTML = `<strong>Contrapunto:</strong><br><br>${respuestaDefensivo}`;
}

// Botones adicionales
document.getElementById('btn-limpiar').addEventListener('click', () => {
    const debateTable = document.getElementById('debate-table');
    while (debateTable.rows.length > 1) {
        debateTable.deleteRow(1);
    }
});

document.getElementById('btn-pdf').addEventListener('click', () => {
    alert("En una implementación real, esto exportaría a PDF usando librerías como jsPDF");
});