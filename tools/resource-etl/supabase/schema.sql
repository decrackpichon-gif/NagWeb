-- NagWeb Resource Catalog v1
-- Preparado para un proyecto Supabase propio de NagWeb.
-- NO ejecutar sobre otros proyectos.

create table if not exists public.resources (
  id text primary key,
  slug text not null,
  source_provider text not null,
  source_external_id text not null,
  family text not null,
  kind text not null,
  title text not null,
  description text,
  license_id text not null,
  status text not null default 'validated',
  source_hash text,
  data jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (source_provider, source_external_id)
);

create index if not exists resources_family_idx
  on public.resources (family);

create index if not exists resources_kind_idx
  on public.resources (kind);

create index if not exists resources_source_provider_idx
  on public.resources (source_provider);

create index if not exists resources_license_id_idx
  on public.resources (license_id);

create index if not exists resources_status_idx
  on public.resources (status);

create index if not exists resources_data_gin_idx
  on public.resources using gin (data);

alter table public.resources enable row level security;

-- El catálogo se carga desde un proceso servidor/ETL con clave secreta.
-- No se crea ninguna policy pública de escritura.
-- Las policies de lectura para NagWeb se definirán cuando integremos
-- el catálogo con la aplicación.
