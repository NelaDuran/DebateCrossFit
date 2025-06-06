const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const router = require('./src/routes/index');
const db = require('./src/database/db');

const app = express();

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.static('public'));
app.use(bodyParser.json());

app.use((req, res, next) => {
    console.log(`📥 [${new Date().toISOString()}] ${req.method} ${req.path}`);
    console.log('Headers:', req.headers);
    console.log('Body:', req.body);
    next();
});

app.use('/api', router);

app.use((err, req, res, next) => {
    console.error('❌ Error:', err);
    res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
        details: err.message
    });
});

const PORT = process.env.PORT || 3001;

async function startServer() {
    try {
        await db.connect();
        app.listen(PORT, () => {
            console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
            console.log(`🔌 MongoDB: ${db.isConnected() ? 'Conectado' : 'Desconectado'}`);
        });
    } catch (error) {
        console.error('❌ Error al iniciar el servidor:', error);
        process.exit(1);
    }
}

startServer();