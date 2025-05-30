# Sistema de Debate entre Coaches (CrossFit vs HEROS)

## 📝 Descripción General
Este sistema implementa una plataforma interactiva de debate entre coaches de CrossFit y HEROS, utilizando la API de Gemini para generar respuestas contextualizadas y mantener una conversación coherente y profesional.

## 🏗️ Arquitectura del Sistema

### Frontend (script.js)
El frontend está construido con JavaScript vanilla y maneja toda la interacción del usuario.

#### Componentes Principales

1. **Variables Globales**
```javascript
let currentDebateId = null;     // ID del debate actual
let isCrossFitTurn = true;      // Control de turnos
let currentTema = '';           // Tema actual del debate
const API_BASE_URL = 'http://localhost:3001';
```

2. **Inicialización (initApp)**
- Función: `initApp()`
- Propósito: Inicializa la aplicación y configura los event listeners
- Acciones:
  - Obtiene referencias a elementos del DOM
  - Configura listeners para botones
  - Carga el último debate si existe

3. **Gestión de Mensajes**

a. **Añadir Mensaje (addMessage)**
```javascript
async function addMessage(tema, coach, contexto)
```
- Propósito: Añade nuevos mensajes al debate
- Parámetros:
  - tema: Tema del debate
  - coach: 'CrossFit' o 'HEROS'
  - contexto: Mensaje anterior para contextualizar
- Flujo:
  1. Valida datos de entrada
  2. Envía petición a la API de Gemini
  3. Guarda respuesta en MongoDB
  4. Actualiza la interfaz

b. **Actualizar Mensaje (updateMessage)**
```javascript
async function updateMessage(mensajeId, nuevoMensaje)
```
- Propósito: Modifica mensajes existentes y regenera respuestas
- Características:
  - Actualiza el mensaje en la base de datos
  - Regenera respuestas subsiguientes si no es el último mensaje
  - Mantiene la coherencia del debate

4. **Gestión de la Interfaz**

a. **Tabla de Debate (addToTable)**
```javascript
function addToTable(coach, mensaje, mensajeId)
```
- Propósito: Renderiza mensajes en la tabla
- Características:
  - Crea contenedores para mensajes
  - Añade botones de edición/eliminación
  - Aplica estilos según el coach

b. **Control de Errores (showError)**
```javascript
function showError(message)
```
- Muestra mensajes de error temporales
- Desaparece automáticamente después de 5 segundos

### Backend (server.js)

#### Componentes Principales

1. **Configuración**
- Express para el servidor web
- MongoDB para almacenamiento
- CORS habilitado para desarrollo
- Middleware para logging

2. **Modelo de Datos**
```javascript
const DebateSchema = new mongoose.Schema({
    tema: String,
    coach: String,
    mensaje: String,
    fecha: Date
});
```

3. **API Endpoints**

a. **Generar Respuesta**
```javascript
POST /api/generar-respuesta
```
- Genera respuestas usando Gemini API
- Parámetros:
  - tema
  - estilo (coach)
  - contexto

b. **Gestión de Mensajes**
```javascript
POST /api/guardar-mensaje    // Guardar nuevo mensaje
GET /api/mensajes           // Obtener mensajes
PUT /api/mensajes/:id       // Actualizar mensaje
DELETE /api/mensajes/:id    // Eliminar mensaje
```

4. **Generación de Prompts**
```javascript
function generatePrompt(tema, estilo, contexto)
```
- Personaliza prompts según el perfil del coach
- Mantiene coherencia en el estilo de respuestas
- Limita longitud de respuestas

## 🎨 Estilos (styles.css)

### Temas de Color
- Esquema principal: Lilas y celestes
- CrossFit: `#6c5ce7`
- HEROS: `#74b9ff`
- Botones con variaciones de la paleta principal

### Características de Diseño
- Diseño responsivo
- Animaciones suaves
- Efectos hover en botones
- Scrollbar personalizado

## 🔄 Flujo de Trabajo

1. **Inicio de Debate**
   - Usuario hace clic en "Generar"
   - Se selecciona tema aleatorio
   - CrossFit inicia el debate

2. **Continuación**
   - Alternancia automática de turnos
   - Cada respuesta considera el contexto anterior
   - Máximo 2 oraciones por respuesta

3. **Edición de Mensajes**
   - Permite modificar cualquier mensaje
   - Regenera respuestas subsiguientes
   - Mantiene coherencia del debate

4. **Exportación**
   - Permite exportar debate a PDF
   - Incluye formato y estilos
   - Mantiene historial completo

## 🛠️ Características Técnicas

### Seguridad
- Validación de datos en frontend y backend
- Sanitización de entradas
- Manejo de errores robusto

### Rendimiento
- Carga asíncrona de datos
- Optimización de renderizado
- Caché de respuestas

### Mantenibilidad
- Código modular
- Funciones documentadas
- Manejo centralizado de errores

## 📋 Requisitos del Sistema

### Frontend
- Navegador moderno con soporte ES6+
- JavaScript habilitado
- Conexión a internet

### Backend
- Node.js 14+
- MongoDB 4+
- API Key de Gemini válida

## 🚀 Instalación y Configuración

1. **Clonar Repositorio**
```bash
git clone [url-repositorio]
```

2. **Instalar Dependencias**
```bash
npm install
```

3. **Configurar Variables de Entorno**
```env
MONGODB_URI=tu_uri_mongodb
GEMINI_API_KEY=tu_api_key
PORT=3001
```

4. **Iniciar Servidor**
```bash
npm start
```

## 🤝 Contribución
- Fork del repositorio
- Crear rama feature/
- Enviar pull request

## 📝 Notas Adicionales
- El sistema está diseñado para ser extensible
- Se pueden añadir más perfiles de coach
- La API de Gemini puede ser reemplazada por otras similares

## 🐛 Depuración
- Los logs están categorizados por emojis
- Mensajes de error descriptivos
- Trazabilidad completa de acciones 