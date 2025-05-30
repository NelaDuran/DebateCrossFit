# Documentación Técnica Detallada - Nivel Avanzado

## 📑 Tabla de Contenidos
1. [Arquitectura del Sistema](#arquitectura-del-sistema)
2. [Frontend en Detalle](#frontend-en-detalle)
3. [Backend en Profundidad](#backend-en-profundidad)
4. [Base de Datos y Persistencia](#base-de-datos-y-persistencia)
5. [Integración con Gemini API](#integración-con-gemini-api)
6. [Sistema de Estilos](#sistema-de-estilos)
7. [Seguridad y Validaciones](#seguridad-y-validaciones)
8. [Optimización y Rendimiento](#optimización-y-rendimiento)
9. [Gestión de Errores](#gestión-de-errores)
10. [Guía de Mantenimiento](#guía-de-mantenimiento)

## Arquitectura del Sistema

### 📐 Diagrama de Arquitectura
```
[Cliente Web] ←→ [Frontend (JavaScript)] ←→ [Backend (Node.js/Express)]
                                            ↕
                                    [MongoDB] ↔ [Gemini API]
```

### 🔄 Flujo de Datos
1. **Solicitud del Cliente**
   ```javascript
   Cliente → Frontend → Backend → {MongoDB/Gemini} → Backend → Frontend → Cliente
   ```

2. **Ciclo de Vida de un Mensaje**
   ```javascript
   Entrada Usuario → Validación Frontend → API Request → 
   Validación Backend → Procesamiento → Almacenamiento → 
   Respuesta → Actualización UI
   ```

## Frontend en Detalle

### 🎯 Gestión del Estado

#### Variables Globales y su Propósito
```javascript
// Estado global de la aplicación
let currentDebateId = null;     // Tracking del debate actual
let isCrossFitTurn = true;      // Control de turnos
let currentTema = '';           // Tema actual
let isProcessing = false;       // Flag de operaciones en curso

// Cache local
const messageCache = new Map();  // Caché de mensajes
const coachProfiles = {         // Perfiles de coach
    CrossFit: { /* ... */ },
    HEROS: { /* ... */ }
};
```

### 🔄 Sistema de Eventos

#### Event Listeners Detallados
```javascript
// Inicialización de listeners
function initializeEventListeners() {
    // Botones principales
    btnGenerar.addEventListener('click', async (e) => {
        e.preventDefault();
        if (isProcessing) return;
        isProcessing = true;
        try {
            await startNewDebate();
        } catch (error) {
            handleError(error);
        } finally {
            isProcessing = false;
        }
    });

    // Gestión de scroll
    debateContainer.addEventListener('scroll', debounce(() => {
        const { scrollTop, scrollHeight, clientHeight } = debateContainer;
        if (scrollTop + clientHeight >= scrollHeight - 50) {
            loadMoreMessages();
        }
    }, 150));

    // Interceptor de teclas
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 's') {
            e.preventDefault();
            saveCurrentState();
        }
    });
}
```

### 📱 Responsive Design

#### Sistema de Breakpoints
```javascript
const BREAKPOINTS = {
    mobile: 480,
    tablet: 768,
    desktop: 1024,
    widescreen: 1200
};

function handleResponsiveLayout() {
    const width = window.innerWidth;
    const container = document.querySelector('.debate-container');
    
    if (width <= BREAKPOINTS.mobile) {
        container.classList.add('mobile-view');
        adjustMobileLayout();
    } else if (width <= BREAKPOINTS.tablet) {
        container.classList.add('tablet-view');
        adjustTabletLayout();
    }
}
```

### 🎨 Renderizado Dinámico

#### Sistema de Templates
```javascript
const Templates = {
    messageContainer: (coach, message, id) => `
        <div class="message-container ${coach.toLowerCase()}" 
             data-id="${id}" 
             data-coach="${coach}">
            <div class="message-header">
                <span class="coach-name">${coach}</span>
                <span class="timestamp">${new Date().toLocaleTimeString()}</span>
            </div>
            <div class="message-content">${sanitizeHTML(message)}</div>
            <div class="message-actions">
                ${generateActionButtons(id)}
            </div>
        </div>
    `,
    
    actionButtons: (id) => `
        <button class="edit-btn" onclick="handleEdit('${id}')">✏️</button>
        <button class="delete-btn" onclick="handleDelete('${id}')">🗑️</button>
    `
};
```

#### Sistema de Renderizado Virtual
```javascript
class VirtualMessageList {
    constructor(container, pageSize = 20) {
        this.container = container;
        this.pageSize = pageSize;
        this.messages = [];
        this.visibleRange = { start: 0, end: pageSize };
    }

    updateVisibleMessages() {
        const visibleMessages = this.messages
            .slice(this.visibleRange.start, this.visibleRange.end)
            .map(msg => Templates.messageContainer(msg.coach, msg.content, msg.id))
            .join('');
        
        this.container.innerHTML = visibleMessages;
    }

    handleScroll(scrollTop) {
        const newStart = Math.floor(scrollTop / MESSAGE_HEIGHT);
        this.visibleRange = {
            start: newStart,
            end: newStart + this.pageSize
        };
        this.updateVisibleMessages();
    }
}
```

## Backend en Profundidad

### 🌐 Middleware Personalizado

#### Logging Avanzado
```javascript
const advancedLogger = (req, res, next) => {
    const start = Date.now();
    const requestId = uuid.v4();
    
    // Logging inicial
    console.log({
        timestamp: new Date().toISOString(),
        requestId,
        method: req.method,
        url: req.url,
        headers: req.headers,
        body: req.body,
        query: req.query
    });

    // Interceptar la respuesta
    const originalSend = res.send;
    res.send = function(body) {
        const duration = Date.now() - start;
        console.log({
            timestamp: new Date().toISOString(),
            requestId,
            duration,
            statusCode: res.statusCode,
            responseBody: body
        });
        originalSend.call(this, body);
    };

    next();
};
```

#### Rate Limiting
```javascript
const rateLimit = {
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // límite por IP
    message: 'Demasiadas solicitudes, por favor intente más tarde',
    handler: (req, res) => {
        res.status(429).json({
            error: 'Rate limit excedido',
            retryAfter: res.getHeader('Retry-After')
        });
    }
};
```

### 🔐 Seguridad Avanzada

#### Sanitización de Entradas
```javascript
const sanitizeInput = (input) => {
    if (typeof input !== 'string') return input;
    
    return input
        .replace(/[<>]/g, '') // Prevenir XSS
        .trim()
        .slice(0, MAX_INPUT_LENGTH);
};

const validateDebateInput = (req, res, next) => {
    const { tema, coach, mensaje } = req.body;
    
    if (!tema || !coach || !mensaje) {
        return res.status(400).json({
            error: 'Campos requeridos faltantes'
        });
    }

    if (!['CrossFit', 'HEROS'].includes(coach)) {
        return res.status(400).json({
            error: 'Coach no válido'
        });
    }

    req.body = {
        tema: sanitizeInput(tema),
        coach: coach,
        mensaje: sanitizeInput(mensaje)
    };

    next();
};
```

### 📡 Gestión de Conexiones

#### Pool de Conexiones MongoDB
```javascript
const mongooseOptions = {
    poolSize: 10,
    bufferMaxEntries: 0,
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    family: 4
};

mongoose.connect(process.env.MONGODB_URI, mongooseOptions)
    .then(() => console.log('✅ MongoDB conectado'))
    .catch(err => {
        console.error('❌ Error de conexión:', err);
        process.exit(1);
    });

// Gestión de reconexión
mongoose.connection.on('disconnected', () => {
    console.log('🔄 Intentando reconectar a MongoDB...');
    setTimeout(() => {
        mongoose.connect(process.env.MONGODB_URI, mongooseOptions);
    }, 5000);
});
```

## Base de Datos y Persistencia

### 📊 Índices Optimizados
```javascript
// Índices para búsqueda rápida
DebateSchema.index({ tema: 'text' });
DebateSchema.index({ fecha: -1 });
DebateSchema.index({ coach: 1, fecha: -1 });

// Índice compuesto para búsquedas frecuentes
DebateSchema.index({ 
    tema: 1, 
    coach: 1, 
    fecha: -1 
});

// Índice TTL para limpieza automática
DebateSchema.index({ 
    fecha: 1 
}, { 
    expireAfterSeconds: 30 * 24 * 60 * 60 // 30 días 
});
```

### 🔄 Transacciones MongoDB
```javascript
async function updateDebateWithTransaction(debateId, newMessage) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // Actualizar mensaje
        const debate = await Debate.findById(debateId).session(session);
        debate.mensaje = newMessage;
        await debate.save();

        // Actualizar estadísticas
        await Stats.updateOne(
            { coach: debate.coach },
            { $inc: { messageCount: 1 } }
        ).session(session);

        await session.commitTransaction();
    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        session.endSession();
    }
}
```

## Integración con Gemini API

### 🤖 Gestión Avanzada de Prompts

#### Sistema de Templates de Prompts
```javascript
const PromptTemplates = {
    debate: {
        initial: (tema, coach) => `
            Eres un coach de ${coach} iniciando un debate sobre: "${tema}".
            Tu personalidad es ${coachProfiles[coach].personalidad}.
            Enfócate en ${coachProfiles[coach].enfoque}.
            Proporciona una opinión inicial breve (máximo 2 oraciones) y formula una pregunta desafiante.
        `,
        response: (tema, coach, contexto) => `
            Como coach de ${coach} en un debate sobre "${tema}":
            Contexto previo: "${contexto}"
            
            Responde de manera concisa y profesional, manteniendo tu enfoque en 
            ${coachProfiles[coach].enfoque}.
            
            Limita tu respuesta a 2 oraciones y concluye con una pregunta relacionada.
            
            Mantén un tono ${coachProfiles[coach].personalidad} pero profesional.
        `
    }
};
```

#### Gestión de Tokens y Rate Limiting
```javascript
class GeminiAPIManager {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.requestCount = 0;
        this.lastReset = Date.now();
        this.rateLimit = {
            maxRequests: 100,
            windowMs: 60000 // 1 minuto
        };
    }

    async canMakeRequest() {
        const now = Date.now();
        if (now - this.lastReset >= this.rateLimit.windowMs) {
            this.requestCount = 0;
            this.lastReset = now;
        }
        return this.requestCount < this.rateLimit.maxRequests;
    }

    async generateResponse(prompt) {
        if (!await this.canMakeRequest()) {
            throw new Error('Rate limit exceeded');
        }

        this.requestCount++;
        
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{ text: prompt }]
                    }]
                })
            });

            if (!response.ok) {
                throw new Error(`API Error: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Gemini API Error:', error);
            throw error;
        }
    }
}
```

## Sistema de Estilos

### 🎨 Sistema de Temas Dinámicos
```javascript
const ThemeManager = {
    themes: {
        light: {
            primary: '#6c5ce7',
            secondary: '#74b9ff',
            background: '#f0f2ff',
            text: '#2d3436',
            border: '#dfe6e9'
        },
        dark: {
            primary: '#7d5fff',
            secondary: '#18dcff',
            background: '#2d3436',
            text: '#dfe6e9',
            border: '#636e72'
        }
    },

    applyTheme(themeName) {
        const theme = this.themes[themeName];
        const root = document.documentElement;
        
        Object.entries(theme).forEach(([property, value]) => {
            root.style.setProperty(`--${property}`, value);
        });
    },

    generateThemeTransitions() {
        return `
            * {
                transition: background-color 0.3s ease,
                           color 0.3s ease,
                           border-color 0.3s ease;
            }
        `;
    }
};
```

### 📱 Sistema de Grid Responsivo
```scss
.debate-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 1rem;
    padding: 1rem;

    @media (max-width: 768px) {
        grid-template-columns: 1fr;
    }

    .message-card {
        display: grid;
        grid-template-rows: auto 1fr auto;
        gap: 0.5rem;
        padding: 1rem;
        border-radius: 8px;
        background: var(--card-bg);
        box-shadow: var(--card-shadow);

        .message-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .message-content {
            overflow-y: auto;
            max-height: 200px;
        }

        .message-footer {
            display: flex;
            justify-content: flex-end;
            gap: 0.5rem;
        }
    }
}
```

## Optimización y Rendimiento

### 🚀 Técnicas de Optimización

#### Lazy Loading de Componentes
```javascript
class LazyLoader {
    constructor() {
        this.observers = new Map();
    }

    observe(element, callback) {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        callback();
                        observer.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.1 }
        );

        observer.observe(element);
        this.observers.set(element, observer);
    }

    disconnect(element) {
        const observer = this.observers.get(element);
        if (observer) {
            observer.disconnect();
            this.observers.delete(element);
        }
    }
}
```

#### Cache de Mensajes
```javascript
class MessageCache {
    constructor(maxSize = 100) {
        this.cache = new Map();
        this.maxSize = maxSize;
    }

    set(key, value) {
        if (this.cache.size >= this.maxSize) {
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }
        this.cache.set(key, {
            value,
            timestamp: Date.now()
        });
    }

    get(key) {
        const item = this.cache.get(key);
        if (!item) return null;
        
        // Actualizar timestamp en acceso
        item.timestamp = Date.now();
        return item.value;
    }

    cleanup() {
        const now = Date.now();
        const maxAge = 30 * 60 * 1000; // 30 minutos

        for (const [key, item] of this.cache.entries()) {
            if (now - item.timestamp > maxAge) {
                this.cache.delete(key);
            }
        }
    }
}
```

## Gestión de Errores

### 🔍 Sistema de Logging Avanzado
```javascript
class Logger {
    static levels = {
        DEBUG: 0,
        INFO: 1,
        WARN: 2,
        ERROR: 3
    };

    constructor(level = 'INFO') {
        this.level = Logger.levels[level];
        this.logs = [];
    }

    log(level, message, data = {}) {
        if (Logger.levels[level] >= this.level) {
            const logEntry = {
                timestamp: new Date().toISOString(),
                level,
                message,
                data,
                stack: new Error().stack
            };

            this.logs.push(logEntry);
            console.log(`[${level}] ${message}`, data);

            if (level === 'ERROR') {
                this.notifyError(logEntry);
            }
        }
    }

    async notifyError(error) {
        // Implementar notificación de errores
        // (por ejemplo, enviar a un servicio de monitoreo)
    }

    getLogs(level) {
        return this.logs.filter(log => 
            Logger.levels[log.level] >= Logger.levels[level]
        );
    }
}
```

### ⚠️ Manejo de Errores Personalizado
```javascript
class CustomError extends Error {
    constructor(message, code, details = {}) {
        super(message);
        this.name = this.constructor.name;
        this.code = code;
        this.details = details;
        this.timestamp = new Date();
    }

    toJSON() {
        return {
            error: this.message,
            code: this.code,
            details: this.details,
            timestamp: this.timestamp
        };
    }
}

class ValidationError extends CustomError {
    constructor(message, details) {
        super(message, 'VALIDATION_ERROR', details);
    }
}

class APIError extends CustomError {
    constructor(message, details) {
        super(message, 'API_ERROR', details);
    }
}
```

## Guía de Mantenimiento

### 🔧 Scripts de Mantenimiento

#### Limpieza de Base de Datos
```javascript
async function cleanupDatabase() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    try {
        const result = await Debate.deleteMany({
            fecha: { $lt: thirtyDaysAgo }
        });

        console.log(`Eliminados ${result.deletedCount} debates antiguos`);
    } catch (error) {
        console.error('Error en limpieza:', error);
    }
}
```

#### Verificación de Integridad
```javascript
async function verifyDatabaseIntegrity() {
    const issues = [];

    // Verificar debates sin mensajes
    const emptyDebates = await Debate.find({
        mensaje: { $in: [null, ''] }
    });

    if (emptyDebates.length > 0) {
        issues.push({
            type: 'EMPTY_DEBATES',
            count: emptyDebates.length,
            ids: emptyDebates.map(d => d._id)
        });
    }

    // Verificar coherencia de turnos
    const debates = await Debate.aggregate([
        {
            $group: {
                _id: '$tema',
                mensajes: { $push: '$coach' }
            }
        }
    ]);

    debates.forEach(debate => {
        let isValid = true;
        let lastCoach = null;

        for (const coach of debate.mensajes) {
            if (lastCoach === coach) {
                isValid = false;
                break;
            }
            lastCoach = coach;
        }

        if (!isValid) {
            issues.push({
                type: 'INVALID_TURN_ORDER',
                tema: debate._id
            });
        }
    });

    return issues;
}
``` 