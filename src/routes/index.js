const express = require("express")
const router = express.Router()
const {
  generarRespuesta,
  guardarMensaje,
  obtenerMensajes,
  eliminarDebates,
  eliminarMensajePorId,
  actualizarMensaje
} = require("../controller/debateController")

router.post("/generar-respuesta", generarRespuesta)
router.post("/guardar-mensaje", guardarMensaje)
router.get("/mensajes/:debateId?", obtenerMensajes)
router.delete("/debates", eliminarDebates)
router.delete("/mensajes/:mensajeId", eliminarMensajePorId)
router.put("/mensajes/:mensajeId", actualizarMensaje)

module.exports = router;
