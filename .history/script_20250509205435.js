// Variables globales
let currentDebateId = null;
let isCrossFitTurn = true;
let currentTema = '';
let debateCount = 0; // Contador para debates simulados cuando MongoDB no está disponible

// Esperar a que el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', function() {
    // Asignar event listeners después de que existan los elementos
    document.getElementById('btn-generar')?.addEventListener('click', iniciarNuevoDebate);
    document.getElementById('btn-continuar')?.addEventListener('click', continuarDebate);
    document.getElementById('btn-limpiar')?.addEventListener('click', limpiarDebate);
    document.getElementById('btn-pdf')?.addEventListener('click', exportarAPDF);
});

// Función para iniciar nuevo debate
async function iniciarNuevoDebate() {
    try {
        limpiarDebate();
        
        const temas = [
            "¿Es mejor el entrenamiento funcional o el tradicional para ganar fuerza?",
            "¿Deben los atletas enfocarse en ejercicios compuestos o aislados?",
            "¿Cuál es la frecuencia ideal de entrenamiento para atletas recreativos?",
            "¿Es necesaria la suplementación para obtener resultados significativos?",
            "¿Qué es más importante: la técnica o la intensidad en el entrenamiento?"
        ];
        
        currentTema = temas[Math.floor(Math.random() * temas.length)];
        isCrossFitTurn = true;
        
        await agregarMensaje(currentTema, 'CrossFit', null);
    } catch (error) {
        mostrarError(error);
    }
}

// Función para continuar el debate
async function continuarDebate() {
    try {
        if (!currentTema) {
            throw new Error('Primero inicia un nuevo debate');
        }
        
        const ultimoMensaje = obtenerUltimoMensaje();
        const coachActual = isCrossFitTurn ? 'CrossFit' : 'HERO\'S';
        
        await agregarMensaje(currentTema, coachActual, ultimoMensaje);
    } catch (error) {
        mostrarError(error);
    }
}

// Función para agregar mensaje al debate
async function agregarMensaje(tema, coach, contexto) {
    try {
        const respuesta = await obtenerRespuestaCoach(tema, coach, contexto);
        
        // Intentar guardar en MongoDB
        try {
            const respuestaGuardado = await guardarMensajeEnBackend(tema, coach, respuesta);
            currentDebateId = respuestaGuardado.debateId || `simulado-${Date.now()}-${++debateCount}`;
        } catch (error) {
            console.warn('Usando modo simulado (sin MongoDB):', error.message);
            currentDebateId = currentDebateId || `simulado-${Date.now()}-${++debateCount}`;
        }
        
        agregarFilaATabla(coach, respuesta);
        isCrossFitTurn = !isCrossFitTurn;
        
        return respuesta;
    } catch (error) {
        console.error('Error en agregarMensaje:', error);
        throw error;
    }
}

// Función para obtener respuesta del coach
async function obtenerRespuestaCoach(tema, coach, contexto) {
    try {
        // Modo desarrollo: usar mock
        if (esEntornoLocal()) {
            return await respuestaMock(tema, coach, contexto);
        }
        
        // Producción: llamar a la API real
        const respuesta = await fetch('/api/generar-respuesta', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tema, estilo: coach, contexto }),
        });
        
        if (!respuesta.ok) {
            const errorData = await respuesta.json();
            throw new Error(errorData.error || 'Error en la API');
        }
        
        const data = await respuesta.json();
        return data.respuesta;
    } catch (error) {
        console.error('Error en obtenerRespuestaCoach:', error);
        return `[Error: ${error.message}]`;
    }
}

// Función para guardar mensaje en el backend
async function guardarMensajeEnBackend(tema, coach, mensaje) {
    const respuesta = await fetch('/api/guardar-mensaje', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tema, coach, mensaje, debateId: currentDebateId }),
    });
    
    if (!respuesta.ok) {
        const errorData = await respuesta.json();
        throw new Error(errorData.error || 'Error al guardar mensaje');
    }
    
    return await respuesta.json();
}

// Función para agregar fila a la tabla
function agregarFilaATabla(coach, mensaje) {
    const tabla = document.getElementById('debate-table');
    if (!tabla) {
        throw new Error('No se encontró la tabla de debate');
    }
    
    const fila = tabla.insertRow();
    
    if (coach === 'CrossFit') {
        fila.insertCell(0).innerHTML = `<strong>Coach CrossFit:</strong><br>${mensaje}`;
        fila.insertCell(1).innerHTML = '';
    } else {
        fila.insertCell(0).innerHTML = '';
        fila.insertCell(1).innerHTML = `<strong>Coach HERO'S:</strong><br>${mensaje}`;
    }
    
    // Auto-scroll al final
    tabla.parentNode.scrollTop = tabla.parentNode.scrollHeight;
}

// Función para limpiar el debate
function limpiarDebate() {
    const tabla = document.getElementById('debate-table');
    if (!tabla) return;
    
    while (tabla.rows.length > 1) {
        tabla.deleteRow(1);
    }
    
    if (!esEntornoLocal()) {
        currentDebateId = null;
    }
}

// Función para exportar a PDF
async function exportarAPDF() {
    try {
        if (!currentDebateId) {
            throw new Error('No hay debate para exportar');
        }
        
        const respuesta = await fetch('/api/generar-pdf', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ debateId: currentDebateId }),
        });
        
        if (!respuesta.ok) {
            const errorData = await respuesta.json();
            throw new Error(errorData.error || 'Error al generar PDF');
        }
        
        const blob = await respuesta.blob();
        descargarArchivo(blob, `debate-${currentDebateId}.pdf`);
    } catch (error) {
        mostrarError(error);
    }
}

// Función para obtener el último mensaje
function obtenerUltimoMensaje() {
    const tabla = document.getElementById('debate-table');
    if (!tabla || tabla.rows.length < 2) return '';
    
    const ultimaFila = tabla.rows[tabla.rows.length - 1];
    return ultimaFila.cells[0].textContent || ultimaFila.cells[1].textContent;
}

// Función mock para desarrollo
async function respuestaMock(tema, coach, contexto) {
    const respuestas = {
        "CrossFit": [
            "En CrossFit, creemos en la variedad constante. ¡Nuevos desafíos cada día!",
            "La intensidad es clave. ¡Más sudor, mejores resultados!",
            "Los WODs son nuestra herramienta principal para el fitness integral.",
            "Comunidad primero. Juntos somos más fuertes.",
            "Técnica + Intensidad = Resultados. ¡No te conformes con menos!"
        ],
        "HERO'S": [
            "En HERO'S, la técnica perfecta es nuestra prioridad número uno.",
            "La fuerza es la base de todo movimiento funcional.",
            "Progresión lineal para ganancias consistentes y seguras.",
            "Los ejercicios compuestos construyen atletas completos.",
            "La paciencia es virtud. Los resultados llegan con consistencia."
        ]
    };
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (contexto) {
        return `Respondiendo a: "${contexto}"\n\n${respuestas[coach][Math.floor(Math.random() * respuestas[coach].length)}`;
    }
    return respuestas[coach][Math.floor(Math.random() * respuestas[coach].length)];
}

// Helper functions
function esEntornoLocal() {
    return window.location.hostname === 'localhost' || 
           window.location.hostname === '127.0.0.1';
}

function descargarArchivo(blob, nombre) {
    const url = URL.createObjectURL(blob);
    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = nombre;
    document.body.appendChild(enlace);
    enlace.click();
    setTimeout(() => {
        document.body.removeChild(enlace);
        URL.revokeObjectURL(url);
    }, 100);
}

function mostrarError(error) {
    console.error('Error:', error);
    alert(`Error: ${error.message}`);
}

// Verificar conexión al iniciar
async function verificarConexion() {
    try {
        const respuesta = await fetch('/api/health');
        const data = await respuesta.json();
        console.log('Estado del servidor:', data);
    } catch (error) {
        console.warn('No se pudo verificar la conexión:', error);
    }
}

// Inicialización
verificarConexion();