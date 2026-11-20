// Manda una notificación de prueba al instante
const { getDb, sendPush, readJson } = require('./_lib');

module.exports = async (req, res) => {
  const { uid } = readJson(req);
  const data = await getDb().get(`u:${uid}`);
  if (!data || !data.sub) return res.status(400).json({ error: 'Primero activa las notificaciones' });
  try {
    await sendPush(req, data.sub, {
      title: '🔔 ¡Funciona!',
      body: 'Así te van a llegar los recordatorios de tus hábitos.',
      url: '/',
    });
    res.status(200).json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: `No se pudo enviar (${e.statusCode || e.message})` });
  }
};
