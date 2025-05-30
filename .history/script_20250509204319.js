let currentDebateId = null;
let isCrossFitTurn = true; // Alterna entre coaches
let currentTema = '';

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

    currentTema = temas[Math.floor(Math.random() * temas.length)];
    
    // Iniciar nuevo debate
    currentDebateId = null;
    isCrossFitTurn = true;
    
    // Primer mensaje de CrossFit
    await addCoachMessage(currentTema, 'CrossFit', null);
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
        
        if (!saveResponse.ok) {
            throw new Error('Error al guardar el mensaje');
        }
        
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
        alert('Error al agregar mensaje: ' + error.message);
    }
}

async function getCoachResponse(tema, coach, contexto) {
    try {
        // En desarrollo usar mock, en producción llamar a la API real
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            return await mockGeminiResponse(tema, coach, contexto);
        } else {
            const response = await fetch('/api/generar-respuesta', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ tema, estilo: coach, contexto }),
            });
            
            if (!response.ok) {
                throw new Error('Error en la respuesta del servidor');
            }
            
            const data = await response.json();
            return data.respuesta;
        }
    } catch (error) {
        console.error("Error obteniendo respuesta:", error);
        return `[Error: ${error.message}]`;
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
    
    // Auto-scroll al último mensaje
    debateTable.parentNode.scrollTop = debateTable.parentNode.scrollHeight;
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
        return `"${contexto}" - ${respuestas[coach][Math.floor(Math.random() * respuestas[coach].length)]}`;
    } else {
        // Mensaje inicial
        return respuestas[coach][Math.floor(Math.random() * respuestas[coach].length)];
    }
}

// Botón para continuar el debate
document.getElementById('btn-continuar').addEventListener('click', async () => {
    if (!currentDebateId) {
        alert('Primero inicia un nuevo debate');
        return;
    }
    
    const lastMessage = getLastMessage();
    await addCoachMessage(currentTema, isCrossFitTurn ? 'CrossFit' : 'HERO\'S', lastMessage);
});

function getLastMessage() {
    const rows = document.getElementById('debate-table').rows;
    if (rows.length < 2) return '';
    
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
    currentTema = '';
});

// Botón para exportar a PDF
document.getElementById('btn-pdf').addEventListener('click', async () => {
    if (!currentDebateId) {
        alert('No hay debate para exportar. Primero inicia un debate.');
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
        
        if (!response.ok) {
            throw new Error('Error al generar PDF');
        }
        
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `debate-${currentDebateId}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    } catch (error) {
        console.error("Error descargando PDF:", error);
        alert('Error al generar el PDF: ' + error.message);
    }
});