// Se llama cada minuto (cron-job.org). Manda los recordatorios que ya tocan.
const { getDb, sendPush, localNow, MENSAJES } = require('./_lib');

// Si la llamada se atrasa, igual se manda dentro de esta ventana (minutos)
const VENTANA = 60;

function aMinutos(hhmm) {
  const [h, m] = String(hhmm).split(':').map(Number);
  return Number.isFinite(h) && Number.isFinite(m) ? h * 60 + m : null;
}

module.exports = async (req, res) => {
  const secret = process.env.CRON_SECRET;
  if (secret && req.query.key !== secret && req.headers.authorization !== `Bearer ${secret}`) {
    return res.status(401).json({ error: 'no autorizado' });
  }

  const redis = getDb();
  const uids = await redis.smembers('users');
  let enviados = 0;

  for (const uid of uids) {
    const data = await redis.get(`u:${uid}`);
    if (!data || !data.sub || !data.state) continue;

    const ahora = localNow(data.tz);
    const done = data.state.done || {};

    for (const h of data.state.habits || []) {
      const rem = aMinutos(h.reminder);
      if (rem === null) continue;
      const diff = ahora.minutes - rem;
      if (diff < 0 || diff > VENTANA) continue;
      if ((done[h.id] || []).includes(ahora.date)) continue; // ya lo hizo hoy

      // Solo una vez por día y por hábito
      const marcado = await redis.set(`s:${uid}:${h.id}:${ahora.date}`, 1, { nx: true, ex: 60 * 60 * 48 });
      if (!marcado) continue;

      const n = [...h.id].reduce((a, c) => a + c.charCodeAt(0), 0) + Number(ahora.date.slice(-2));
      try {
        await sendPush(req, data.sub, {
          title: h.name,
          body: MENSAJES[n % MENSAJES.length],
          url: '/',
          tag: h.id,
        });
        enviados++;
      } catch (e) {
        // La suscripción ya no existe (borró la app o quitó el permiso)
        if (e.statusCode === 404 || e.statusCode === 410) {
          await redis.set(`u:${uid}`, { ...data, sub: null });
        }
      }
    }
  }

  res.status(200).json({ ok: true, usuarios: uids.length, enviados });
};
