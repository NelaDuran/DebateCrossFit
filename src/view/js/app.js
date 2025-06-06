const API_BASE_URL = 'http://localhost:3001';
const DEBATE_TEMAS = [
    "¿Es mejor el entrenamiento funcional o el tradicional para ganar fuerza?",
    "¿Deben los atletas enfocarse en ejercicios compuestos o aislados?",
    "¿Cuál es la frecuencia ideal de entrenamiento para atletas recreativos?",
    "¿Es necesaria la suplementación para obtener resultados significativos?",
    "¿Qué es más importante: la técnica o la intensidad en el entrenamiento?"
];

const appState = {
    currentDebateId: null,
    isCrossFitTurn: true,
    currentTema: '',
    lastMessage: null
};

const elements = {
    debateTable: document.getElementById('debate-table'),
    btnGenerar: document.getElementById('btn-generar'),
    btnContinuar: document.getElementById('btn-continuar'),
    btnLimpiar: document.getElementById('btn-limpiar'),
    btnPdf: document.getElementById('btn-pdf'),
    errorMessage: document.getElementById('error-message')
};


function app() {
    configuracionEventos();
    cargarUltimosDebates();
}

function configuracionEventos() {
    elements.btnGenerar.addEventListener('click', nuevoDebate);
    elements.btnContinuar.addEventListener('click', continueDebate);
    elements.btnLimpiar.addEventListener('click', limpiarDebate);
    elements.btnPdf.addEventListener('click', exportarPdf);
}

async function fetchAPI(endpoint, options = {}) {
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            headers: { 'Content-Type': 'application/json' },
            ...options
        });

        if (!response.ok) throw new Error('Error en la respuesta del servidor');
        return await response.json();
    } catch (error) {
        mostrarError(error.message);
        throw error;
    }
}

async function nuevoDebate() {
    limpiarTabla();
    appState.currentTema = DEBATE_TEMAS[Math.floor(Math.random() * DEBATE_TEMAS.length)];
    appState.isCrossFitTurn = true;

    const data = await fetchAPI('/api/guardar-mensaje', {
        method: 'POST',
        body: JSON.stringify({
            tema: appState.currentTema,
            coach: 'CrossFit',
            mensaje: appState.currentTema
        })
    });

    appState.currentDebateId = data.debateId;
    agregarTabla('CrossFit', appState.currentTema, data.debateId);
}

async function continueDebate() {
    if (!appState.currentTema) {
        mostrarError('Primero inicia un nuevo debate');
        return;
    }

    const currentCoach = appState.isCrossFitTurn ? 'CrossFit' : 'HEROS';
    const lastMessage = ultimoMensajeContenido();

    const data = await fetchAPI('/api/generar-respuesta', {
        method: 'POST',
        body: JSON.stringify({
            tema: appState.currentTema,
            estilo: currentCoach,
            contexto: lastMessage
        })
    });

    const saveResponse = await fetchAPI('/api/guardar-mensaje', {
        method: 'POST',
        body: JSON.stringify({
            tema: appState.currentTema,
            coach: currentCoach,
            mensaje: data.respuesta
        })
    });

    agregarTabla(currentCoach, data.respuesta, saveResponse.debateId);
    appState.isCrossFitTurn = !appState.isCrossFitTurn;
}

async function limpiarDebate() {
    try {

        limpiarTabla();


        await fetchAPI('/api/debates', { method: 'DELETE' });

        appState.currentDebateId = null;
        appState.currentTema = '';
        appState.isCrossFitTurn = true;
        appState.lastMessage = null;

        console.log('Debate limpiado completamente');
    } catch (error) {
        mostrarError('Error al limpiar el debate: ' + error.message);
    }
}


function limpiarTabla() {
    while (elements.debateTable.rows.length > 1) {
        elements.debateTable.deleteRow(1);
    }
}

function agregarTabla(coach, mensaje, mensajeId) {
    const row = elements.debateTable.insertRow();
    const cell1 = row.insertCell(0);
    const cell2 = row.insertCell(1);

    const messageContainer = crearMensajeContenedor(mensaje, mensajeId);

    if (coach == 'CrossFit') {
        cell1.appendChild(messageContainer);
        cell1.className = 'crossfit-message';
    } else {
        cell2.appendChild(messageContainer);
        cell2.className = 'heros-message';
    }

    scrollToBottom();
}

function crearMensajeContenedor(mensaje, mensajeId) {
    const container = document.createElement('div');
    container.className = 'message-container';
    container.dataset.messageId = mensajeId;

    const messageText = document.createElement('p');
    messageText.textContent = mensaje;

    const actions = document.createElement('div');
    actions.className = 'action-buttons';

    const editButton = document.createElement('button');
    editButton.innerHTML = '✏️';
    editButton.onclick = () => editarMensaje(mensajeId);

    const deleteButton = document.createElement('button');
    deleteButton.innerHTML = '🗑️';
    deleteButton.onclick = () => borrarMensaje(mensajeId);

    actions.append(editButton, deleteButton);
    container.append(messageText, actions);

    return container;
}

function ultimoMensajeContenido() {
    const rows = elements.debateTable.rows;
    if (rows.length < 2) return null;

    const lastRow = rows[rows.length - 1];
    const crossfitCell = lastRow.cells[0];
    const herosCell = lastRow.cells[1];

    if (crossfitCell.querySelector('.message-container')) {
        return `CrossFit: ${crossfitCell.querySelector('p').textContent}`;
    }
    if (herosCell.querySelector('.message-container')) {
        return `HEROS: ${herosCell.querySelector('p').textContent}`;
    }
    return null;
}

function scrollToBottom() {
    elements.debateTable.parentNode.scrollTop = elements.debateTable.parentNode.scrollHeight;
}

function mostrarError(message) {
    elements.errorMessage.textContent = message;
    elements.errorMessage.classList.add('visible');
    setTimeout(() => elements.errorMessage.classList.remove('visible'), 5000);
}

async function borrarMensaje(mensajeId) {
    if (!confirm('¿Estás seguro de eliminar este mensaje?')) return;

    await fetchAPI(`/api/mensajes/${mensajeId}`, { method: 'DELETE' });
    cargarUltimosDebates();
}

async function editarMensaje(mensajeId) {
    const row = document.querySelector(`[data-message-id="${mensajeId}"]`).closest('tr');
    const currentText = row.querySelector('p').textContent;
    const newText = prompt('Editar mensaje:', currentText);

    if (newText && newText !== currentText) {
        await fetchAPI(`/api/mensajes/${mensajeId}`, {
            method: 'PUT',
            body: JSON.stringify({ mensaje: newText })
        });
        cargarUltimosDebates();
    }
}

async function cargarUltimosDebates() {
    try {
        const data = await fetchAPI('/api/mensajes');

        if (data.mensajes?.length > 0) {
            const debate = data.mensajes[0];
            appState.currentTema = debate.tema;
            limpiarTabla();

            debate.mensajes.forEach(msg => {
                agregarTabla(msg.coach, msg.mensaje, msg._id);
                appState.currentDebateId = msg._id;
            });

            appState.isCrossFitTurn = debate.mensajes.length % 2 === 0;
        }
    } catch (error) {
        mostrarError('Error al cargar debate: ' + error.message);
    }
}

async function exportarPdf() {
    if (!appState.currentDebateId) {
        mostrarError('No hay debate para exportar');
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text(`Debate: ${appState.currentTema}`, 105, 20, { align: 'center' });

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');

    let yPosition = 40;
    const rows = elements.debateTable.rows;

    for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        const coach = row.cells[0].textContent ? 'CrossFit' : 'HEROS';
        const message = row.cells[0].textContent || row.cells[1].textContent;

        doc.setFont('helvetica', 'bold');
        doc.setTextColor(coach == 'CrossFit' ? '#e74c3c' : '#2ecc71');
        doc.text(`${coach}:`, 20, yPosition);

        doc.setFont('helvetica', 'normal');
        doc.setTextColor(40, 40, 40);
        const lines = doc.splitTextToSize(message.replace(`${coach}:`, ''), 160);
        doc.text(lines, 30, yPosition + 7);

        yPosition += 10 + (lines.length * 7);

        if (yPosition > 260 && i < rows.length - 1) {
            doc.addPage();
            yPosition = 20;
        }
    }

    doc.setFontSize(10);
    doc.text(`Generado el: ${new Date().toLocaleString()}`, 105, 285, { align: 'center' });
    doc.save(`debate-${appState.currentDebateId}.pdf`);
}


app();