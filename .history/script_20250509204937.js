let currentDebateId = null;
let isCrossFitTurn = true;
let currentTema = '';

// Elementos UI
const debateTable = document.getElementById('debate-table');
const btnGenerar = document.getElementById('btn-generar');
const btnContinuar = document.getElementById('btn-continuar');
const btnLimpiar = document.getElementById('btn-limpiar');
const btnPdf = document.getElementById('btn-pdf');

// Iniciar nuevo debate
btnGenerar.addEventListener('click', async () => {
    try {
        // Limpiar tabla
        while (debateTable.rows.length > 1) {
            debateTable.deleteRow(1);
        }

        // Temas de debate
        const temas = [
            "¿Es mejor el entrenamiento funcional o el tradicional para ganar fuerza?",
            "¿Deben los atletas enfocarse en ejercicios compuestos o aislados?",
            "¿Cuál es la frecuencia ideal de entrenamiento para atletas recreativos?",
            "¿Es necesaria la suplementación para obtener resultados significativos?",
            "¿Qué es más importante: la técnica o la intensidad en el entrenamiento?"
        ];

        currentTema = temas[Math.floor(Math.random() * temas.length)];
        currentDebateId = null;
        isCrossFitTurn = true;
        
        // Primer mensaje
        await addCoachMessage(currentTema, 'CrossFit', null);
    } catch (error) {
        showError(error);
    }
});

// Continuar debate
btnContinuar.addEventListener('click', async () => {
    try {
        if (!currentDebateId) {
            throw new Error('Primero inicia un nuevo debate');
        }
        
        const lastMessage = getLastMessage();
        await addCoachMessage(
            currentTema, 
            isCrossFitTurn ? 'CrossFit' : 'HERO\'S', 
            lastMessage
        );
    } catch (error) {
        showError(error);
    }
});

// Limpiar debate
btnLimpiar.addEventListener('click', () => {
    clearDebate();
});

// Exportar a PDF
btnPdf.addEventListener('click', async () => {
    try {
        if (!currentDebateId) {
            throw new Error('No hay debate para exportar');
        }

        const response = await fetch('/api/generar-pdf', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ debateId: currentDebateId }),
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Error al generar PDF');
        }
        
        const blob = await response.blob();
        downloadFile(blob, `debate-${currentDebateId}.pdf`);
    } catch (error) {
        showError(error);
    }
});

// Función para añadir mensaje
async function addCoachMessage(tema, coach, contexto) {
    try {
        const respuesta = await getCoachResponse(tema, coach, contexto);
        
        const saveResponse = await fetch('/api/guardar-mensaje', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tema, coach, mensaje: respuesta }),
        });
        
        const saveData = await saveResponse.json();
        
        if (!saveData.success) {
            throw new Error(saveData.error || 'Error al guardar');
        }
        
        currentDebateId = saveData.debateId || saveData.data?._id;
        addMessageToTable(coach, respuesta);
        isCrossFitTurn = !isCrossFitTurn;
        
        return respuesta;
    } catch (error) {
        console.error("Error en addCoachMessage:", error);
        throw error;
    }
}

// Obtener respuesta del coach
async function getCoachResponse(tema, coach, contexto) {
    try {
        // Modo desarrollo: usar mock
        if (isLocalEnvironment()) {
            return await mockGeminiResponse(tema, coach, contexto);
        }
        
        // Producción: llamar a la API real
        const response = await fetch('/api/generar-respuesta', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tema, estilo: coach, contexto }),
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Error en la API');
        }
        
        const data = await response.json();
        return data.respuesta;
    } catch (error) {
        console.error("Error en getCoachResponse:", error);
        return `[Error: ${error.message}]`;
    }
}

// Añadir mensaje a la tabla
function addMessageToTable(coach, mensaje) {
    const row = debateTable.insertRow();
    
    if (coach === 'CrossFit') {
        row.insertCell(0).innerHTML = `<strong>Coach CrossFit:</strong><br>${mensaje}`;
        row.insertCell(1).innerHTML = '';
    } else {
        row.insertCell(0).innerHTML = '';
        row.insertCell(1).innerHTML = `<strong>Coach HERO'S:</strong><br>${mensaje}`;
    }
    
    // Auto-scroll
    debateTable.parentNode.scrollTop = debateTable.parentNode.scrollHeight;
}

// Función mock para desarrollo
async function mockGeminiResponse(tema, coach, contexto) {
    const respuestas = {
        "CrossFit": [
            "En CrossFit, la variedad es clave. ¡Nunca hagas el mismo WOD dos veces!",
            "La técnica es importante, pero la intensidad genera resultados reales.",
            "Los ejercicios funcionales preparan para la vida real, no solo para el gimnasio.",
            "La comunidad en el box es nuestro diferencial. ¡Entrena en grupo!",
            "Si no estás sudando, no estás progresando. ¡Dale intensidad!"
        ],
        "HERO'S": [
            "En HERO'S, la técnica perfecta es lo primero. Sin técnica, no hay progreso real.",
            "La fuerza es la base de todo movimiento funcional.",
            "Los ejercicios compuestos son esenciales para un desarrollo equilibrado.",
            "La progresión lineal es fundamental. No hay atajos para el éxito.",
            "La recuperación es tan importante como el entrenamiento. Escucha a tu cuerpo."
        ]
    };

    await delay(800);
    
    if (contexto) {
        return `Respondiendo a: "${contexto}"\n\n${respuestas[coach][Math.floor(Math.random() * respuestas[coach].length)}`;
    }
    return respuestas[coach][Math.floor(Math.random() * respuestas[coach].length)];
}

// Helper functions
function getLastMessage() {
    if (debateTable.rows.length < 2) return '';
    const lastRow = debateTable.rows[debateTable.rows.length - 1];
    return lastRow.cells[0].textContent || lastRow.cells[1].textContent;
}

function clearDebate() {
    while (debateTable.rows.length > 1) {
        debateTable.deleteRow(1);
    }
    currentDebateId = null;
    isCrossFitTurn = true;
    currentTema = '';
}

function showError(error) {
    console.error("Error:", error);
    alert(`Error: ${error.message}`);
}

function downloadFile(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, 100);
}

function isLocalEnvironment() {
    return window.location.hostname === 'localhost' || 
           window.location.hostname === '127.0.0.1';
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Verificar conexión al cargar
async function checkConnection() {
    try {
        const response = await fetch('/api/health');
        const data = await response.json();
        console.log('Estado del servidor:', data);
    } catch (error) {
        console.error("Error verificando conexión:", error);
    }
}

// Inicialización
checkConnection();