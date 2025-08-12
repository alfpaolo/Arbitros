# Asignador de Árbitros (PWA)

Stack: Vite + React + TypeScript + TailwindCSS + Supabase + Vite PWA.

## Desarrollo

1. Copiar `.env.example` a `.env` y completar `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`.
2. Instalar deps: `npm i`
3. Dev: `npm run dev`

## Base de datos (Supabase)

- Ejecutar `supabase/schema.sql` en el editor SQL de Supabase.
- Usar autenticación por magic link o email/password para árbitros y admin (asignar `is_admin=true`).

## Build

- `npm run build` genera `dist/` con PWA lista para hosting estático.

## Deploy en Donweb (hosting básico)

- Subir el contenido de `dist/` a `public_html/`.
- Asegurar `index.html` como documento por defecto.
- PWA funcionará offline gracias a `vite-plugin-pwa`.

## Rutas

- `/login`: acceso árbitros/administradores
- `/disponibilidad`: carga de disponibilidad por árbitro
- `/admin`: ABM de clubes, sedes, partidos y asignaciones

## Próximos pasos

- Implementar autenticación con Supabase (magic link/email).
- Formularios con React Hook Form + Zod.
- Algoritmo de asignación automática respetando disponibilidad y cercanía espaciotemporal (considerando `venue_distances`).
