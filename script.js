// Variables de estado
let currentDebateId = null;
let isCrossFitTurn = true;
let currentTema = '';

// URL base para las APIs
const API_BASE_URL = 'http://localhost:3001';

// Elementos del DOM
let debateTable, btnGenerar, btnContinuar, btnLimpiar, btnPdf, errorMessage;

/**
 * Inicializa la aplicación cuando el DOM está listo
 */
async function initApp() {
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

        // Cargar último debate si existe
        await loadLastDebate();

        console.log('Aplicación inicializada correctamente');
    } catch (error) {
        console.error('Error en initApp:', error);
        showError('Error al cargar la aplicación. Por favor recarga la página.');
    }
}

/**
 * Limpia solo la tabla en el frontend
 */
function clearTable() {
    console.log('🧹 Limpiando tabla en el frontend...');
    while (debateTable.rows.length > 1) {
        debateTable.deleteRow(1);
    }
}

/**
 * Limpia el debate actual y la base de datos
 */
async function clearDebate() {
    try {
        console.log('🗑️ Limpiando debate completamente...');
        
        // Limpiar la tabla en el frontend
        clearTable();
        
        // Limpiar la base de datos
        console.log('🗑️ Eliminando debates de la base de datos...');
        const response = await fetch(`${API_BASE_URL}/api/debates`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            throw new Error('Error eliminando debates de la base de datos');
        }

        const data = await response.json();
        console.log('✅ Base de datos limpiada:', data);
        
        // Reiniciar variables de estado
        currentDebateId = null;
        currentTema = '';
        isCrossFitTurn = true;
        
        console.log('✅ Debate limpiado completamente');
    } catch (error) {
        console.error('❌ Error en clearDebate:', error);
        showError('Error al limpiar el debate: ' + error.message);
    }
}

/**
 * Carga el último debate de la base de datos
 */
async function loadLastDebate() {
    try {
        console.log('🔄 Cargando debates...');
        const response = await fetch(`${API_BASE_URL}/api/mensajes`);
        if (!response.ok) throw new Error('Error cargando debates');
        
        const data = await response.json();
        console.log('📥 Datos recibidos de /api/mensajes:', data);

        if (data.mensajes && data.mensajes.length > 0) {
            // Obtener el debate más reciente (el primero del array)
            const debateReciente = data.mensajes[0];
            console.log('✅ Debate encontrado:', debateReciente);

            // Limpiar tabla actual sin afectar la base de datos
            clearTable();
            
            // Establecer el estado del debate actual
            currentTema = debateReciente.tema;
            
            // Mostrar todos los mensajes del debate
            console.log('📝 Procesando mensajes para mostrar en tabla...');
            debateReciente.mensajes.forEach((msg, index) => {
                console.log(`Mensaje ${index + 1}:`, msg);
                addToTable(msg.coach, msg.mensaje, msg._id);
                // Guardar el ID del último mensaje como currentDebateId
                currentDebateId = msg._id;
            });
            
            // Actualizar turno basado en el número total de mensajes
            isCrossFitTurn = debateReciente.mensajes.length % 2 === 0;
            console.log('🎮 Turno actualizado:', isCrossFitTurn ? 'CrossFit' : 'HEROS');
        } else {
            console.log('ℹ️ No hay debates previos');
            clearTable(); // Solo limpiar la tabla si no hay debates
        }
    } catch (error) {
        console.error('❌ Error cargando último debate:', error);
        showError('Error al cargar el debate: ' + error.message);
    }
}

/**
 * Inicia un nuevo debate
 */
async function startNewDebate() {
    try {
        // Solo limpiar la tabla, no la base de datos
        clearTable();
        
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
        console.error('❌ Error en startNewDebate:', error);
        showError('Error al iniciar nuevo debate: ' + error.message);
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
        if (!lastMessage) {
            throw new Error('No se encontró el último mensaje');
        }

        console.log('Continuando debate:', {
            tema: currentTema,
            turno: isCrossFitTurn ? 'CrossFit' : 'HEROS',
            ultimoMensaje: lastMessage
        });

        const currentCoach = isCrossFitTurn ? 'CrossFit' : 'HEROS';
        await addMessage(currentTema, currentCoach, lastMessage);
    } catch (error) {
        console.error('Error en continueDebate:', error);
        showError(error.message);
    }
}

/**
 * Obtiene el último mensaje del debate incluyendo el coach
 */
function getLastMessage() {
    try {
        if (!debateTable || debateTable.rows.length < 2) {
            console.log('No hay mensajes previos en la tabla');
            return null;
        }
        
        const lastRow = debateTable.rows[debateTable.rows.length - 1];
        const crossfitCell = lastRow.cells[0];
        const herosCell = lastRow.cells[1];
        
        // Obtener el texto del mensaje del contenedor
        let message = '';
        let coach = '';
        
        if (crossfitCell.querySelector('.message-container')) {
            message = crossfitCell.querySelector('p').textContent;
            coach = 'CrossFit';
        } else if (herosCell.querySelector('.message-container')) {
            message = herosCell.querySelector('p').textContent;
            coach = 'HEROS';
        }
        
        if (message && coach) {
            const formattedMessage = `${coach}: ${message}`;
            console.log('Último mensaje recuperado:', formattedMessage);
            return formattedMessage;
        }
        
        return null;
    } catch (error) {
        console.error('Error en getLastMessage:', error);
        return null;
    }
}

/**
 * Agrega un mensaje al debate
 */
async function addMessage(tema, coach, contexto) {
    try {
        console.log('Enviando petición con:', { tema, coach, contexto });

        // Validar que tenemos todos los datos necesarios
        if (!tema || !coach) {
            throw new Error('Faltan datos requeridos (tema o coach)');
        }

        // Obtener el contexto completo del debate
        let mensajeContexto = '';
        if (contexto) {
            // Usar el contexto tal como viene, ya incluye el coach
            mensajeContexto = contexto;
        }

        // Preparar los datos para la API
        const requestData = {
            tema: tema,
            estilo: coach,
            contexto: mensajeContexto
        };

        console.log('Datos de la petición:', requestData);

        const response = await fetch(`${API_BASE_URL}/api/generar-respuesta`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(requestData)
        });

        console.log('Respuesta del servidor:', response.status);

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Error en la respuesta del servidor');
        }

        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.error || 'Error desconocido del servidor');
        }

        // Asegurarse de que tenemos una respuesta válida
        const mensaje = data.respuesta || 'Error: No se recibió una respuesta válida';
        
        // Guardar mensaje en MongoDB
        const saveResponse = await fetch(`${API_BASE_URL}/api/guardar-mensaje`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                tema,
                coach,
                mensaje
            })
        });

        if (!saveResponse.ok) {
            const saveErrorData = await saveResponse.json();
            throw new Error(saveErrorData.error || 'Error guardando mensaje');
        }

        const saveData = await saveResponse.json();
        currentDebateId = currentDebateId || saveData.debateId;
        
        addToTable(coach, mensaje, saveData.debateId);
        isCrossFitTurn = !isCrossFitTurn;
    } catch (error) {
        console.error('Error en addMessage:', error);
        showError('Error al agregar mensaje: ' + error.message);
        throw error;
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
 * Agrega una fila a la tabla de debate
 */
function addToTable(coach, mensaje, mensajeId) {
    try {
        if (!debateTable) {
            console.error('❌ Error: debateTable no está definido');
            return;
        }

        console.log('📝 Agregando mensaje a la tabla:', { coach, mensaje, mensajeId });
        const row = debateTable.insertRow();
        
        // Validar el coach
        if (!['CrossFit', 'HEROS'].includes(coach)) {
            console.error('❌ Coach no válido:', coach);
            throw new Error(`Coach no válido: ${coach}`);
        }

        // Crear las celdas
        const cell1 = row.insertCell(0);
        const cell2 = row.insertCell(1);

        const messageContainer = document.createElement('div');
        messageContainer.className = 'message-container';
        messageContainer.setAttribute('data-message-id', mensajeId); // Establecer el ID como atributo de datos
        
        // Contenido del mensaje
        const messageText = document.createElement('p');
        messageText.textContent = mensaje;
        messageContainer.appendChild(messageText);
        
        // Botones de acción
        const actionButtons = document.createElement('div');
        actionButtons.className = 'action-buttons';
        
        // Botón de editar
        const editButton = document.createElement('button');
        editButton.innerHTML = '✏️';
        editButton.className = 'edit-btn';
        editButton.onclick = () => {
            const nuevoMensaje = prompt('Editar mensaje:', mensaje);
            if (nuevoMensaje && nuevoMensaje !== mensaje) {
                updateMessage(mensajeId, nuevoMensaje);
            }
        };
        
        // Botón de eliminar
        const deleteButton = document.createElement('button');
        deleteButton.innerHTML = '🗑️';
        deleteButton.className = 'delete-btn';
        deleteButton.onclick = () => {
            if (confirm('¿Estás seguro de que quieres eliminar este mensaje?')) {
                deleteMessage(mensajeId);
            }
        };
        
        actionButtons.appendChild(editButton);
        actionButtons.appendChild(deleteButton);
        messageContainer.appendChild(actionButtons);
        
        if (coach === 'CrossFit') {
            cell1.appendChild(messageContainer);
            cell2.textContent = '';
            cell1.className = 'crossfit-message';
        } else {
            cell1.textContent = '';
            cell2.appendChild(messageContainer);
            cell2.className = 'heros-message';
        }
        
        // Auto-scroll al final
        if (debateTable.parentNode) {
            debateTable.parentNode.scrollTop = debateTable.parentNode.scrollHeight;
        }
        
        console.log('✅ Mensaje agregado correctamente a la tabla');
    } catch (error) {
        console.error('❌ Error en addToTable:', error);
        showError('Error al mostrar el mensaje: ' + error.message);
        throw error;
    }
}

/**
 * Elimina un mensaje específico
 */
async function deleteMessage(mensajeId) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/mensajes/${mensajeId}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            throw new Error('Error eliminando mensaje');
        }

        // Recargar los mensajes después de eliminar
        await loadLastDebate();
    } catch (error) {
        console.error('Error:', error);
        showError('Error al eliminar el mensaje');
    }
}

/**
 * Actualiza un mensaje específico y genera una nueva respuesta si es necesario
 */
async function updateMessage(mensajeId, nuevoMensaje) {
    try {
        // Obtener información del mensaje actual antes de actualizarlo
        const row = findMessageRowById(mensajeId);
        if (!row) {
            throw new Error('No se encontró el mensaje a actualizar');
        }

        const currentCoach = row.cells[0].querySelector('.message-container') ? 'CrossFit' : 'HEROS';
        
        // Actualizar el mensaje en la base de datos
        const response = await fetch(`${API_BASE_URL}/api/mensajes/${mensajeId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ mensaje: nuevoMensaje })
        });

        if (!response.ok) {
            throw new Error('Error actualizando mensaje');
        }

        // Recargar los mensajes
        await loadLastDebate();
        
        // Actualizar el turno basado en el mensaje modificado
        isCrossFitTurn = currentCoach === 'HEROS';

        // Si no es el último mensaje, necesitamos regenerar la siguiente respuesta
        const isLastMessage = row === debateTable.rows[debateTable.rows.length - 1];
        if (!isLastMessage) {
            // Construir el contexto con el mensaje modificado
            const contexto = `${currentCoach}: ${nuevoMensaje}`;
            
            // Generar nueva respuesta del otro coach
            const nextCoach = currentCoach === 'CrossFit' ? 'HEROS' : 'CrossFit';
            await addMessage(currentTema, nextCoach, contexto);
        }

    } catch (error) {
        console.error('Error:', error);
        showError('Error al actualizar el mensaje');
    }
}

/**
 * Encuentra la fila de un mensaje por su ID
 */
function findMessageRowById(mensajeId) {
    const messageContainer = document.querySelector(`.message-container[data-message-id="${mensajeId}"]`);
    if (messageContainer) {
        return messageContainer.closest('tr');
    }
    return null;
}

// Inicializar la aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', initApp);