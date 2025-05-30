// =============================================
// Variables globales
// =============================================
let currentDebateId = null;
let isCrossFitTurn = true;
let currentTema = '';

// =============================================
// Funciones principales
// =============================================

/**
 * Función mock para desarrollo - Versión simplificada y robusta
 */
async function mockResponse(tema, coach, contexto) {
    const responses = {
        CrossFit: [
            "En CrossFit, priorizamos variedad e intensidad en los WODs.",
            "La técnica es importante, pero la intensidad marca la diferencia.",
            "Los ejercicios funcionales son clave para un fitness completo."
        ],
        HEROS: [  // Cambiado de HERO'S a HEROS para evitar problemas
            "En HEROS, la técnica perfecta es nuestra máxima prioridad.",
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
 * Verifica si estamos en entorno local
 */
function isLocalEnv() {
    return window.location.hostname === 'localhost' || 
           window.location.hostname === '127.0.0.1';
}

// =============================================
// Funciones de UI
// =============================================

/**
 * Muestra error en la interfaz
 */
function showError(message) {
    const errorElement = document.getElementById('error-message') || createErrorElement();
    errorElement.textContent = message;
    errorElement.classList.add('visible');
    
    setTimeout(() => {
        errorElement.classList.remove('visible');
    }, 5000);
}

function createErrorElement() {
    const div = document.createElement('div');
    div.id = 'error-message';
    document.body.appendChild(div);
    return div;
}

// =============================================
// Funciones de inicialización
// =============================================

/**
 * Inicializa la aplicación
 */
function initApp() {
    try {
        // Asignar event listeners
        document.getElementById('btn-generar').addEventListener('click', startNewDebate);
        document.getElementById('btn-continuar').addEventListener('click', continueDebate);
        document.getElementById('btn-limpiar').addEventListener('click', clearDebate);
        document.getElementById('btn-pdf').addEventListener('click', exportToPDF);
        
        console.log('Aplicación inicializada correctamente');
    } catch (error) {
        console.error('Error al inicializar:', error);
        showError('Error al cargar la aplicación');
    }
}

// Esperar a que el DOM esté listo
document.addEventListener('DOMContentLoaded', initApp);