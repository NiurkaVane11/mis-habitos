// Guarda y devuelve los hábitos del usuario (y su suscripción a notificaciones)
const { getDb, readJson } = require('./_lib');

const validUid = (u) => typeof u === 'string' && /^[a-zA-Z0-9-]{8,64}$/.test(u);

module.exports = async (req, res) => {
  const redis = getDb();

  if (req.method === 'GET') {
    const uid = req.query.uid;
    if (!validUid(uid)) return res.status(400).json({ error: 'uid inválido' });
    const data = await redis.get(`u:${uid}`);
    return res.status(200).json({ state: data ? data.state : null });
  }

  if (req.method === 'PUT' || req.method === 'POST') {
    const { uid, state, sub, tz } = readJson(req);
    if (!validUid(uid) || !state || !Array.isArray(state.habits)) {
      return res.status(400).json({ error: 'datos inválidos' });
    }
    const prev = (await redis.get(`u:${uid}`)) || {};
    await redis.set(`u:${uid}`, {
      state,
      sub: sub === undefined ? prev.sub || null : sub,
      tz: tz || prev.tz || 'America/Guayaquil',
      updated: Date.now(),
    });
    await redis.sadd('users', uid);
    return res.status(200).json({ ok: true });
  }

  res.status(405).json({ error: 'método no permitido' });
};
