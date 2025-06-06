const mongoose = require('mongoose')

const DebateSchema = new mongoose.Schema({
    tema: { type: String, required: true },
    coach: { type: String, required: true, enum: ['CrossFit', 'HEROS'] },
    mensaje: { type: String, required: true },
    fecha: { type: Date, default: Date.now }
}, { collection: 'debates' })

module.exports = mongoose.model('Debate', DebateSchema)