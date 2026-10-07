# Supabase para el catálogo de NagWeb

Esta integración está preparada pero NO conectada a ningún proyecto.

Importante:
- No usar el proyecto Supabase de Vélez Data.
- Crear un proyecto Supabase exclusivo para NagWeb.
- Ejecutar `supabase/schema.sql` solamente en ese proyecto.
- La clave secreta se usa únicamente en el importador local/servidor.
- Nunca exponer `NAGWEB_SUPABASE_SECRET_KEY` en el frontend.

Cuando exista el proyecto propio de NagWeb, el ETL podrá hacer upsert de los recursos normalizados en la tabla `resources`.

La escritura está pensada para ser idempotente:
- mismo `id` => actualiza;
- recurso nuevo => inserta;
- no duplica por cada sincronización.
