document.getElementById('btn-generar').addEventListener('click', async () => {
    const debateTable = document.getElementById('debate-table');

    // Limpiamos filas anteriores (excepto cabecera)
    while (debateTable.rows.length > 1) {
        debateTable.deleteRow(1);
    }

    // Temas de debate para coaches
    const temas = [
        "¿Es mejor el entrenamiento funcional o el tradicional para ganar fuerza?",
        "¿Deben los atletas enfocarse en ejercicios compuestos o aislados?",
        "¿Cuántos días a la semana es ideal para entrenar en CrossFit/HERO'S?"
    ];

    // Seleccionar un tema aleatorio
    const tema = temas[Math.floor(Math.random() * temas.length)];

    try {
        // Obtener respuestas de la API (simuladas o reales)
        const respuestaCrossFit = await getCoachResponse(tema, "CrossFit");
        const respuestaHeros = await getCoachResponse(tema, "HERO'S");

        // Añadir fila al debate
        addDebateRow(tema, respuestaCrossFit, respuestaHeros);

        // Guardar en MongoDB
        await saveDebateToDB(tema, respuestaCrossFit, respuestaHeros);
    } catch (error) {
        console.error("Error generando debate:", error);
    }
});

// Función para obtener respuesta del coach (puede ser mock o real)
async function getCoachResponse(tema, estilo) {
    // En desarrollo podrías usar el mock, en producción llamarías a tu API
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        return mockGeminiResponse(tema, estilo);
    } else {
        const response = await fetch('/api/generar-respuesta', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ tema, estilo }),
        });
        const data = await response.json();
        return data.respuesta;
    }
}

// Función mock para simular Gemini
async function mockGeminiResponse(tema, estilo) {
    const respuestas = {
        "CrossFit": [
            "Como coach de CrossFit, creo en la variedad y alta intensidad. Ejemplo: los WODs mejoran todas las capacidades físicas.",
            "La técnica es clave en CrossFit. Movimientos como el snatch deben dominarse antes de aumentar peso.",
            "Prefiero entrenamientos cortos e intensos que sesiones largas. La intensidad genera adaptaciones."
        ],
        "HERO'S": [
            "En HERO'S, la fuerza es fundamental. Ejercicios como sentadilla y peso muerto son la base.",
            "Sin una buena técnica, no hay progreso. Primero dominar el movimiento, luego aumentar carga.",
            "La periodización es esencial. No se puede estar al 100% todo el año."
        ]
    };

    // Simulamos delay de API
    await new Promise(resolve => setTimeout(resolve, 800));
    return respuestas[estilo][Math.floor(Math.random() * respuestas[estilo].length)];
}

function addDebateRow(tema, respuestaCrossFit, respuestaHeros) {
    const row = document.getElementById('debate-table').insertRow();

    const cellCrossFit = row.insertCell(0);
    const cellHeros = row.insertCell(1);

    cellCrossFit.innerHTML = `<strong>Tema:</strong> ${tema}<br><br>${respuestaCrossFit}`;
    cellHeros.innerHTML = `<strong>Contrapunto:</strong><br><br>${respuestaHeros}`;
}

// Función para guardar en MongoDB
async function saveDebateToDB(tema, respuestaCrossFit, respuestaHeros) {
    try {
        const response = await fetch('/api/guardar-debate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ tema, respuestaCrossFit, respuestaHeros }),
        });
        const data = await response.json();
        console.log('Debate guardado:', data);
    } catch (error) {
        console.error('Error guardando debate:', error);
    }
}

// Botón limpiar - ahora genera nuevo debate
document.getElementById('btn-limpiar').addEventListener('click', async () => {
    const debateTable = document.getElementById('debate-table');
    while (debateTable.rows.length > 1) {
        debateTable.deleteRow(1);
    }
    
    // Generar nuevo debate automáticamente al limpiar
    document.getElementById('btn-generar').click();
});

// Botón para ver historial (opcional)
document.getElementById('btn-pdf').addEventListener('click', async () => {
    try {
        const response = await fetch('/api/debates');
        const debates = await response.json();
        console.log('Historial de debates:', debates);
        alert(`Hay ${debates.length} debates guardados. Consulta la consola para verlos.`);
    } catch (error) {
        console.error('Error obteniendo historial:', error);
    }
});