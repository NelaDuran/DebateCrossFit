// Función mock para desarrollo - Versión corregida
async function respuestaMock(tema, coach, contexto) {
    try {
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
        
        // Validar que el coach existe en las respuestas
        if (!respuestas[coach]) {
            throw new Error(`Coach no reconocido: ${coach}`);
        }
        
        // Simular delay de red
        await new Promise(resolve => setTimeout(resolve, 500));
        
        if (contexto) {
            return `Respondiendo a: "${contexto}"\n\n${
                respuestas[coach][Math.floor(Math.random() * respuestas[coach].length)
            }`;
        }
        return respuestas[coach][Math.floor(Math.random() * respuestas[coach].length)];
    } catch (error) {
        console.error('Error en respuestaMock:', error);
        return `[Simulación fallida: ${error.message}]`;
    }
}

// Helper functions - Versión mejorada

/**
 * Determina si estamos en un entorno local de desarrollo
 * @returns {boolean} True si es localhost
 */
function esEntornoLocal() {
    try {
        return ['localhost', '127.0.0.1'].includes(window.location.hostname) ||
               window.location.hostname === '';
    } catch (e) {
        console.warn('Error verificando entorno local:', e);
        return false;
    }
}

/**
 * Descarga un archivo desde un Blob
 * @param {Blob} blob - El blob a descargar
 * @param {string} nombre - Nombre del archivo
 */
function descargarArchivo(blob, nombre) {
    try {
        if (!(blob instanceof Blob)) {
            throw new Error('El parámetro blob no es válido');
        }
        
        const url = URL.createObjectURL(blob);
        const enlace = document.createElement('a');
        enlace.href = url;
        enlace.download = nombre;
        enlace.style.display = 'none';
        
        document.body.appendChild(enlace);
        enlace.click();
        
        // Limpieza asíncrona
        setTimeout(() => {
            document.body.removeChild(enlace);
            URL.revokeObjectURL(url);
        }, 100);
    } catch (error) {
        console.error('Error en descargarArchivo:', error);
        alert('Error al descargar el archivo');
    }
}

/**
 * Muestra errores al usuario
 * @param {Error|string} error - El error a mostrar
 */
function mostrarError(error) {
    try {
        const mensaje = error instanceof Error ? error.message : String(error);
        console.error('Error:', error);
        
        // Mostrar en UI en lugar de alert (mejor UX)
        const errorContainer = document.getElementById('error-container') || createErrorContainer();
        errorContainer.textContent = `Error: ${mensaje}`;
        errorContainer.style.display = 'block';
        
        setTimeout(() => {
            errorContainer.style.display = 'none';
        }, 5000);
    } catch (e) {
        console.error('Error al mostrar error:', e);
        alert(`Error: ${error}`);
    }
}

function createErrorContainer() {
    const container = document.createElement('div');
    container.id = 'error-container';
    container.style = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        padding: 15px;
        background: #ff4444;
        color: white;
        border-radius: 5px;
        display: none;
        z-index: 1000;
    `;
    document.body.appendChild(container);
    return container;
}

/**
 * Verifica la conexión con el servidor
 */
async function verificarConexion() {
    try {
        const respuesta = await fetch('/api/health', {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            cache: 'no-store'
        });
        
        if (!respuesta.ok) {
            throw new Error(`HTTP ${respuesta.status}`);
        }
        
        const data = await respuesta.json();
        console.log('Estado del servidor:', data);
        
        // Mostrar estado en UI si lo deseas
        updateConnectionStatus(data);
        
        return data;
    } catch (error) {
        console.warn('No se pudo verificar la conexión:', error);
        updateConnectionStatus({ status: 'offline', error: error.message });
        return { status: 'offline', error: error.message };
    }
}

function updateConnectionStatus(status) {
    const statusElement = document.getElementById('connection-status') || createStatusElement();
    statusElement.textContent = `Estado: ${status.status}`;
    statusElement.style.color = status.status === 'OK' ? 'green' : 'red';
}

function createStatusElement() {
    const element = document.createElement('div');
    element.id = 'connection-status';
    element.style = `
        position: fixed;
        top: 10px;
        right: 10px;
        padding: 5px 10px;
        background: white;
        border: 1px solid #ccc;
        border-radius: 3px;
        font-size: 12px;
        z-index: 1000;
    `;
    document.body.appendChild(element);
    return element;
}

// Inicialización segura
document.addEventListener('DOMContentLoaded', function() {
    try {
        verificarConexion();
        
        // Opcional: Mostrar si estamos en modo simulado
        if (esEntornoLocal()) {
            console.log('Modo desarrollo: usando funciones mock');
            const devBadge = document.createElement('div');
            devBadge.textContent = 'Modo Desarrollo';
            devBadge.style = `
                position: fixed;
                bottom: 10px;
                left: 10px;
                padding: 5px 10px;
                background: #ffcc00;
                color: black;
                border-radius: 3px;
                font-size: 12px;
                z-index: 1000;
            `;
            document.body.appendChild(devBadge);
        }
    } catch (error) {
        console.error('Error en la inicialización:', error);
    }
});