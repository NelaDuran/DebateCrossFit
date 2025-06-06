require('dotenv').config();
const mongoose = require('mongoose');

class MongoDB {
  constructor(uri = 'mongodb://127.0.0.1:27017/debates-coaches') {
    this.uri = uri;
    this.connected = false;
    this.connecting = false;
  }

  async connect() {
    if (this.connected) return;
    if (this.connecting) {
      // Si ya está intentando conectar, espera a que termine
      while (this.connecting) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      return;
    }

    this.connecting = true;
    try {
      await mongoose.connect(this.uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 5000
      });

      this.connected = true;
      this.connecting = false;

      console.log('✅ Conectado a MongoDB');
      console.log('📊 Estado de la conexión:', mongoose.connection.readyState);
      console.log('🔌 URL de conexión:', mongoose.connection.host);
      console.log('📁 Base de datos:', mongoose.connection.name);

      this._handleEvents();
    } catch (err) {
      this.connecting = false;
      console.error('❌ Error conectando a MongoDB:', err);
      console.error('Stack trace:', err.stack);
      throw err; // Propagar el error en lugar de salir del proceso
    }
  }

  async disconnect() {
    if (this.connected) {
      await mongoose.connection.close();
      console.log('👋 Conexión a MongoDB cerrada');
      this.connected = false;
    }
  }

  _handleEvents() {
    mongoose.connection.on('error', err => {
      console.error('❌ Error en la conexión MongoDB:', err);
      this.connected = false;
    });

    mongoose.connection.on('disconnected', () => {
      console.log('🔌 Desconectado de MongoDB');
      this.connected = false;
    });

    mongoose.connection.on('reconnected', () => {
      console.log('🔄 Reconectado a MongoDB');
      this.connected = true;
    });

    process.on('SIGINT', async () => {
      await this.disconnect();
      process.exit(0);
    });
  }

  isConnected() {
    return this.connected;
  }
}

module.exports = new MongoDB();