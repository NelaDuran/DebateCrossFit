// Variables de estado
let currentDebateId = null;
let isCrossFitTurn = true;
let currentTema = '';

// Elementos del DOM
let debateTable, btnGenerar, btnContinuar, btnLimpiar, btnPdf, errorMessage;

/**
 * Inicializa la aplicación cuando el DOM está listo
 */
function initApp() {
    try {
        // Obtener referencias a los elementos del DOM
        debateTable = document.getElementById('debate-table');
        btnGenerar = document.getElementById('btn-generar');
        btnContinuar = document.getElementById('btn-continuar');
        btnLimpiar = document.getElementById('btn-limpiar');
        btnPdf = document.getElementById('btn-pdf');
        errorMessage = document.getElementById('error-message');

        // Verificar que todos los elementos existen
        if (!debateTable || !btnGenerar || !btnContinuar || !btnLimpiar || !btnPdf) {
            throw new Error('No se encontraron todos los elementos necesarios en el DOM');
        }

        // Asignar event listeners
        btnGenerar.addEventListener('click', startNewDebate);
        btnContinuar.addEventListener('click', continueDebate);
        btnLimpiar.addEventListener('click', clearDebate);
        btnPdf.addEventListener('click', exportToPDF);

        console.log('Aplicación inicializada correctamente');
    } catch (error) {
        console.error('Error en initApp:', error);
        showError('Error al cargar la aplicación. Por favor recarga la página.');
    }
}

/**
 * Inicia un nuevo debate
 */
async function startNewDebate() {
    try {
        clearDebate();
        
        const temas = [
            "¿Es mejor el entrenamiento funcional o el tradicional para ganar fuerza?",
            "¿Deben los atletas enfocarse en ejercicios compuestos o aislados?",
            "¿Cuál es la frecuencia ideal de entrenamiento para atletas recreativos?",
            "¿Es necesaria la suplementación para obtener resultados significativos?",
            "¿Qué es más importante: la técnica o la intensidad en el entrenamiento?"
        ];
        
        currentTema = temas[Math.floor(Math.random() * temas.length)];
        isCrossFitTurn = true;
        
        await addMessage(currentTema, 'CrossFit', null);
    } catch (error) {
        console.error('Error en startNewDebate:', error);
        showError('Error al iniciar nuevo debate');
    }
}

/**
 * Continúa el debate existente
 */
async function continueDebate() {
    try {
        if (!currentTema) {
            throw new Error('Primero inicia un nuevo debate');
        }
        
        const lastMessage = getLastMessage();
        const currentCoach = isCrossFitTurn ? 'CrossFit' : 'HEROS';
        
        await addMessage(currentTema, currentCoach, lastMessage);
    } catch (error) {
        console.error('Error en continueDebate:', error);
        showError(error.message);
    }
}

/**
 * Agrega un mensaje al debate
 */
async function addMessage(tema, coach, contexto) {
    try {
        const respuesta = await getCoachResponse(tema, coach, contexto);
        
        // En una implementación real, aquí guardarías en MongoDB
        currentDebateId = currentDebateId || `simulated-${Date.now()}`;
        
        addToTable(coach, respuesta);
        isCrossFitTurn = !isCrossFitTurn;
    } catch (error) {
        console.error('Error en addMessage:', error);
        throw error;
    }
}

/**
 * Obtiene respuesta del coach (mock o API real)
 */
async function getCoachResponse(tema, coach, contexto) {
    try {
        if (isLocalEnv()) {
            return await getMockResponse(tema, coach, contexto);
        }
        
        // En producción, llamar a la API real
        const response = await fetch('/api/generar-respuesta', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tema, estilo: coach, contexto }),
        });
        
        if (!response.ok) {
            throw new Error('Error en la respuesta del servidor');
        }
        
        const data = await response.json();
        return data.respuesta;
    } catch (error) {
        console.error('Error en getCoachResponse:', error);
        return `[Error: ${error.message}]`;
    }
}

/**
 * Función mock para desarrollo
 */
async function getMockResponse(tema, coach, contexto) {
    const responses = {
        CrossFit: [
            "En CrossFit, priorizamos variedad e intensidad en los WODs.",
            "La técnica es importante, pero la intensidad marca la diferencia.",
            "Los ejercicios funcionales son clave para un fitness completo."
        ],
        HEROS: [
            "En HERO'S, la técnica perfecta es nuestra máxima prioridad.",
            "La fuerza es la base fundamental de todo entrenamiento.",
            "La progresión lineal asegura resultados consistentes."
        ]
    };

    await new Promise(resolve => setTimeout(resolve, 300));
    
    const randomIndex = Math.floor(Math.random() * responses[coach].length);
    return contexto 
        ? `Respondiendo a: "${contexto}"\n${responses[coach][randomIndex]}`
        : responses[coach][randomIndex];
}

/**
 * Limpia el debate actual
 */
function clearDebate() {
    try {
        while (debateTable.rows.length > 1) {
            debateTable.deleteRow(1);
        }
        currentDebateId = null;
    } catch (error) {
        console.error('Error en clearDebate:', error);
        showError('Error al limpiar el debate');
    }
}

/**
 * Exporta el debate a PDF
 */
async function exportToPDF() {
    try {
        if (!currentDebateId || debateTable.rows.length <= 1) {
            throw new Error('No hay debate para exportar. Primero inicia un debate.');
        }

        // Verificar que jsPDF está disponible
        if (!window.jspdf) {
            throw new Error('La librería PDF no está disponible. Recarga la página.');
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        // Configuración inicial
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(18);
        doc.setTextColor(40, 40, 40);
        doc.text(`Debate: ${currentTema}`, 105, 20, { align: 'center' });
        
        // Contenido del debate
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        
        let yPosition = 40;
        const rows = debateTable.rows;
        
        for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            const coach = row.cells[0].textContent ? 'CrossFit' : 'HERO\'S';
            const message = row.cells[0].textContent || row.cells[1].textContent;
            
            // Estilo según el coach
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(coach === 'CrossFit' ? '#e74c3c' : '#2ecc71');
            doc.text(`${coach}:`, 20, yPosition);
            
            // Mensaje
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(40, 40, 40);
            const lines = doc.splitTextToSize(message.replace(`${coach}:`, ''), 160);
            doc.text(lines, 30, yPosition + 7);
            
            yPosition += 10 + (lines.length * 7);
            
            // Nueva página si es necesario
            if (yPosition > 260 && i < rows.length - 1) {
                doc.addPage();
                yPosition = 20;
            }
        }

        // Pie de página
        doc.setFontSize(10);
        doc.text(`Generado el: ${new Date().toLocaleString()}`, 105, 285, { align: 'center' });

        // Descargar el PDF
        doc.save(`debate-${currentDebateId}.pdf`);
        
    } catch (error) {
        console.error('Error en exportToPDF:', error);
        showError(error.message);
    }
}

/**
 * Muestra un mensaje de error
 */
function showError(message) {
    try {
        if (!errorMessage) {
            console.error('No se encontró el elemento para mostrar errores');
            return;
        }
        
        errorMessage.textContent = message;
        errorMessage.classList.add('visible');
        
        setTimeout(() => {
            errorMessage.classList.remove('visible');
        }, 5000);
    } catch (error) {
        console.error('Error en showError:', error);
    }
}

/**
 * Verifica si estamos en entorno local
 */
function isLocalEnv() {
    try {
        return ['localhost', '127.0.0.1', ''].includes(window.location.hostname);
    } catch (error) {
        console.error('Error en isLocalEnv:', error);
        return false;
    }
}

/**
 * Obtiene el último mensaje del debate
 */
function getLastMessage() {
    try {
        if (debateTable.rows.length < 2) return '';
        const lastRow = debateTable.rows[debateTable.rows.length - 1];
        return lastRow.cells[0].textContent || lastRow.cells[1].textContent;
    } catch (error) {
        console.error('Error en getLastMessage:', error);
        return '';
    }
}

/**
 * Agrega una fila a la tabla de debate
 */
function addToTable(coach, message) {
    try {
        const row = debateTable.insertRow();
        
        if (coach === 'CrossFit') {
            row.insertCell(0).innerHTML = `<strong>Coach CrossFit:</strong><br>${message}`;
            row.insertCell(1).innerHTML = '';
        } else {
            row.insertCell(0).innerHTML = '';
            row.insertCell(1).innerHTML = `<strong>Coach HERO'S:</strong><br>${message}`;
        }
        
        // Auto-scroll al final
        debateTable.parentNode.scrollTop = debateTable.parentNode.scrollHeight;
    } catch (error) {
        console.error('Error en addToTable:', error);
        throw error;
    }
}

// Inicializar la aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', initApp);