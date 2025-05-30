let currentDebateId = null;
let isCrossFitTurn = true; // Alterna entre coaches

document.getElementById('btn-generar').addEventListener('click', async () => {
    // Limpiar tabla
    const debateTable = document.getElementById('debate-table');
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

    const tema = temas[Math.floor(Math.random() * temas.length)];
    
    // Iniciar nuevo debate
    currentDebateId = null;
    isCrossFitTurn = true;
    
    // Primer mensaje de CrossFit
    await addCoachMessage(tema, 'CrossFit', null);
});

async function addCoachMessage(tema, coach, contexto) {
    try {
        // Obtener respuesta del coach
        const respuesta = await getCoachResponse(tema, coach, contexto);
        
        // Guardar en MongoDB
        const saveResponse = await fetch('/api/guardar-mensaje', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                tema, 
                coach, 
                mensaje: respuesta,
                debateId: currentDebateId 
            }),
        });
        const saveData = await saveResponse.json();
        
        // Actualizar ID del debate si es nuevo
        if (!currentDebateId) {
            currentDebateId = saveData.debateId;
        }
        
        // Añadir fila a la tabla
        addMessageToTable(coach, respuesta);
        
        // Alternar turno
        isCrossFitTurn = !isCrossFitTurn;
        
        return respuesta;
    } catch (error) {
        console.error("Error añadiendo mensaje:", error);
    }
}

async function getCoachResponse(tema, coach, contexto) {
    // En desarrollo usar mock, en producción llamar a la API real
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        return mockGeminiResponse(tema, coach, contexto);
    } else {
        const response = await fetch('/api/generar-respuesta', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ tema, estilo: coach, contexto }),
        });
        const data = await response.json();
        return data.respuesta;
    }
}

function addMessageToTable(coach, mensaje) {
    const debateTable = document.getElementById('debate-table');
    const row = debateTable.insertRow();
    
    if (coach === 'CrossFit') {
        row.insertCell(0).innerHTML = `<strong>Coach CrossFit:</strong><br>${mensaje}`;
        row.insertCell(1).innerHTML = '';
    } else {
        row.insertCell(0).innerHTML = '';
        row.insertCell(1).innerHTML = `<strong>Coach HERO'S:</strong><br>${mensaje}`;
    }
}

// Función mock para desarrollo
async function mockGeminiResponse(tema, coach, contexto) {
    const respuestas = {
        "CrossFit": [
            "En CrossFit, creemos en la variedad constante para evitar estancamientos. ¡Nunca hagas el mismo WOD dos veces!",
            "La técnica es crucial, pero la intensidad es lo que genera resultados reales. ¡Push it to the limit!",
            "Los ejercicios funcionales preparan para la vida real. ¿Cuándo necesitarás hacer un curl de bíceps aislado en el mundo real?",
            "La comunidad es nuestra mayor fortaleza. El apoyo del box hace la diferencia.",
            "Si no estás sudando, no estás progresando. La incomodidad es donde ocurre el crecimiento."
        ],
        "HERO'S": [
            "En HERO'S priorizamos la técnica perfecta antes que la carga. Una sentadilla bien hecha vale más que 100 malas.",
            "La fuerza es la base de todo. Sin fuerza, no hay potencia ni resistencia real.",
            "Los ejercicios compuestos son esenciales, pero los accesorios tienen su lugar para corregir desbalances.",
            "La progresión lineal es clave. No hay atajos para construir un físico fuerte y funcional.",
            "La recuperación es parte del entrenamiento. Más no siempre es mejor."
        ]
    };

    await new Promise(resolve => setTimeout(resolve, 800));
    
    if (contexto) {
        // Respuesta a mensaje previo
        return `"${contexto}" - ${respuestas[coach][Math.floor(Math.random() * respuestas[coach].length)}`;
    } else {
        // Mensaje inicial
        return respuestas[coach][Math.floor(Math.random() * respuestas[coach].length)];
    }
}

// Botón para continuar el debate
document.getElementById('btn-continuar').addEventListener('click', async () => {
    if (!currentDebateId) return;
    
    const lastMessage = getLastMessage();
    const tema = document.getElementById('debate-table').rows[1].cells[0].textContent.split(':')[1] || 
                 document.getElementById('debate-table').rows[1].cells[1].textContent.split(':')[1];
    
    const coach = isCrossFitTurn ? 'CrossFit' : 'HERO\'S';
    await addCoachMessage(tema.trim(), coach, lastMessage);
});

function getLastMessage() {
    const rows = document.getElementById('debate-table').rows;
    const lastRow = rows[rows.length - 1];
    return lastRow.cells[0].textContent || lastRow.cells[1].textContent;
}

// Botón limpiar - reinicia el debate
document.getElementById('btn-limpiar').addEventListener('click', () => {
    const debateTable = document.getElementById('debate-table');
    while (debateTable.rows.length > 1) {
        debateTable.deleteRow(1);
    }
    currentDebateId = null;
    isCrossFitTurn = true;
});

// Botón para exportar a PDF
document.getElementById('btn-pdf').addEventListener('click', async () => {
    if (!currentDebateId) {
        alert('No hay debate para exportar');
        return;
    }

    try {
        const response = await fetch('/api/generar-pdf', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ debateId: currentDebateId }),
        });
        
        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `debate-${currentDebateId}.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        } else {
            throw new Error('Error generando PDF');
        }
    } catch (error) {
        console.error("Error descargando PDF:", error);
        alert('Error al generar el PDF');
    }
});