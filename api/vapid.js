// Devuelve la clave pública para suscribirse a las notificaciones
const { getVapid } = require('./_lib');

module.exports = async (req, res) => {
  try {
    const { publicKey } = await getVapid();
    res.status(200).json({ publicKey });
  } catch (e) {
    res.status(500).json({ error: 'No se pudo leer la base de datos. ¿Conectaste Upstash en Vercel?' });
  }
};
