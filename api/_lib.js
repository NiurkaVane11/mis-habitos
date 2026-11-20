// Utilidades compartidas por las funciones de /api (Vercel ignora archivos que empiezan con _)
const webpush = require('web-push');
const { Redis } = require('@upstash/redis');

// ---------- Base de datos (Upstash Redis). Sin variables, usa memoria (solo para probar en local) ----------
let db;
function getDb() {
  if (db) return db;
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  if (url && token) {
    db = new Redis({ url, token });
  } else {
    const mem = new Map();
    db = {
      async get(k) { return mem.has(k) ? JSON.parse(mem.get(k)) : null; },
      async set(k, v, opts = {}) {
        if (opts.nx && mem.has(k)) return null;
        mem.set(k, JSON.stringify(v));
        return 'OK';
      },
      async del(k) { mem.delete(k); },
      async sadd(k, m) { const s = new Set(mem.has(k) ? JSON.parse(mem.get(k)) : []); s.add(m); mem.set(k, JSON.stringify([...s])); },
      async srem(k, m) { const s = new Set(mem.has(k) ? JSON.parse(mem.get(k)) : []); s.delete(m); mem.set(k, JSON.stringify([...s])); },
      async smembers(k) { return mem.has(k) ? JSON.parse(mem.get(k)) : []; },
      _mem: mem,
    };
  }
  return db;
}

// ---------- Claves VAPID: se crean solas la primera vez y se guardan en la base ----------
async function getVapid() {
  if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    return { publicKey: process.env.VAPID_PUBLIC_KEY, privateKey: process.env.VAPID_PRIVATE_KEY };
  }
  const redis = getDb();
  let keys = await redis.get('vapid');
  if (!keys) {
    await redis.set('vapid', webpush.generateVAPIDKeys(), { nx: true });
    keys = await redis.get('vapid');
  }
  return keys;
}

async function sendPush(req, sub, payload) {
  const { publicKey, privateKey } = await getVapid();
  const host = req.headers['x-forwarded-host'] || req.headers.host || 'habitos.vercel.app';
  return webpush.sendNotification(sub, JSON.stringify(payload), {
    vapidDetails: { subject: `https://${host}`, publicKey, privateKey },
    TTL: 60 * 60,
    urgency: 'high',
  });
}

// ---------- Fechas en la zona horaria del usuario ----------
function localNow(tz, date = new Date()) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone: tz || 'America/Guayaquil',
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
    }).formatToParts(date).map((p) => [p.type, p.value])
  );
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    minutes: Number(parts.hour) * 60 + Number(parts.minute),
  };
}

const MENSAJES = [
  '¡Es hora! No rompas tu racha 🔥',
  'Un pasito más hoy 💪',
  '¿Ya lo hiciste hoy? Márcalo ✅',
  'Tu yo del futuro te lo agradece ✨',
];

function readJson(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  try { return JSON.parse(req.body || '{}'); } catch { return {}; }
}

module.exports = { getDb, getVapid, sendPush, localNow, MENSAJES, readJson };
