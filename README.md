# Arbitros Assigner (PWA + Tailwind + Express)

Aplicación full‑stack para gestionar árbitros, disponibilidades, clubes, partidos y asignaciones.
Incluye:
- Frontend React + Vite + Tailwind (PWA básico: `manifest.webmanifest` + `sw.js`).
- Backend Express con persistencia simple en `server/db.json`.
- Algoritmo de asignación que respeta disponibilidad, evita solapamientos y considera cercanía entre clubes con un buffer de traslado.

## Requisitos
- Node.js 18 o superior.

## Instalación
```bash
cd arbitros-assigner
npm run install-all
```

## Desarrollo
En una consola:
```bash
npm run dev
```
- Servidor API: http://localhost:4000
- Frontend: http://localhost:5173

*(El servidor backend usa CORS en desarrollo.)*

## Build
```bash
npm run build
```
Luego puedes servir `client/dist` detrás de cualquier servidor estático y apuntar el backend a `http://localhost:4000`.

## Datos iniciales
`server/db.json` tiene datos de ejemplo (clubes, árbitros, partidos). Puedes editarlo en caliente.

## Credenciales (demo)
- Admin: usuario `admin` (sin password en demo, elegir rol en el login).
- Árbitro: elige cualquier árbitro de la lista en el login.

> **Nota**: Este proyecto es un "starter" listo para extender a una solución productiva (auth real, BD relacional, etc.).
