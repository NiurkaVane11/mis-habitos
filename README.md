# My Habit Tracker ♡

https://mis-habitos-chi.vercel.app

Mi Habit Tracker original (pixel art rosa) con dos cosas nuevas:

- El hábito Listening podcast 🎧
- Recordatorio diario por notificación, como Bimo: a la hora que elijas te avisa qué hábitos te faltan. Si ya hiciste todos, no te avisa.

## Cómo publicarla

1. Sube esta carpeta a un repo nuevo de GitHub.
2. En Vercel: Add New → Project → importa el repo → Deploy.
3. En el proyecto de Vercel: Storage → Upstash for Redis → Create → Connect. Luego Deployments → Redeploy.
4. Los avisos los dispara GitHub Actions cada 5 minutos (`.github/workflows/recordatorios.yml`), así que pueden llegar hasta unos minutos después de la hora.
5. En el iPhone abre la URL en Safari → Compartir → Agregar a pantalla de inicio. Ábrela desde el ícono, crea un hábito con recordatorio y acepta las notificaciones.

En ⚙️ hay un botón para mandar una notificación de prueba.

## Estructura

```
index.html            La app (HTML, CSS y JS)
sw.js                 Recibe las notificaciones
manifest.webmanifest  Para instalarla en el iPhone
api/state.js          Guarda la hora del aviso y lo marcado en Redis
api/vapid.js          Clave pública para las notificaciones (se crea sola)
api/cron.js           Revisa cada minuto qué recordatorios tocan
api/test.js           Notificación de prueba
```
