-- Supabase schema for Hotel Manager
-- Run in Supabase SQL editor. Adjust enums/domains as needed.

-- Profiles table mirrors auth.users with extra fields
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  nombre text,
  rol text not null default 'recepcionista',
  activo boolean not null default true,
  created_at timestamp with time zone default now()
);

create unique index if not exists profiles_email_key on public.profiles (email);

-- Tasks (tareas)
create table if not exists public.tareas (
  id bigserial primary key,
  titulo text not null,
  descripcion text,
  usuario_asignado uuid references auth.users(id) on delete set null,
  usuario_creador uuid references auth.users(id) on delete set null,
  estado text not null default 'pendiente',
  prioridad text not null default 'media',
  fecha_limite date,
  fecha_creacion timestamp with time zone default now(),
  fecha_completado timestamp with time zone
);

-- Notes (notas)
create table if not exists public.notas (
  id bigserial primary key,
  titulo text not null,
  contenido text not null,
  usuario_id uuid not null references auth.users(id) on delete cascade,
  tipo text not null check (tipo in ('personal','equipo','general')),
  importante boolean not null default false,
  usuario_asignado uuid references auth.users(id) on delete set null,
  fecha_creacion timestamp with time zone default now()
);

-- Attendance (asistencias)
create table if not exists public.asistencias (
  id bigserial primary key,
  usuario_id uuid not null references auth.users(id) on delete cascade,
  fecha date not null,
  hora_entrada time without time zone,
  hora_salida time without time zone,
  tipo text,
  ubicacion text,
  observaciones text,
  created_at timestamp with time zone default now()
);

-- Reports (reportes)
create table if not exists public.reportes (
  id bigserial primary key,
  titulo text not null,
  descripcion text not null,
  usuario_id uuid not null references auth.users(id) on delete cascade,
  tipo text not null default 'general',
  estado text not null default 'abierto',
  prioridad text not null default 'media',
  fecha_creacion timestamp with time zone default now()
);

-- RLS policies
alter table public.profiles enable row level security;
alter table public.tareas enable row level security;
alter table public.notas enable row level security;
alter table public.asistencias enable row level security;
alter table public.reportes enable row level security;

-- Profiles: user can see/update own profile
create policy if not exists profiles_self_select on public.profiles
  for select using (auth.uid() = id);
create policy if not exists profiles_self_update on public.profiles
  for update using (auth.uid() = id);

-- Helper: is_admin_or_supervisor check via profiles
-- Usage inside policies via exists() predicate

-- Tareas policies
create policy if not exists tareas_owner_select on public.tareas
  for select using (
    usuario_asignado = auth.uid() or usuario_creador = auth.uid() or exists (
      select 1 from public.profiles p where p.id = auth.uid() and p.rol in ('admin','supervisor')
    )
  );
create policy if not exists tareas_owner_insert on public.tareas
  for insert with check (
    usuario_creador = auth.uid() or exists (
      select 1 from public.profiles p where p.id = auth.uid() and p.rol in ('admin','supervisor')
    )
  );
create policy if not exists tareas_owner_update on public.tareas
  for update using (
    usuario_asignado = auth.uid() or usuario_creador = auth.uid() or exists (
      select 1 from public.profiles p where p.id = auth.uid() and p.rol in ('admin','supervisor')
    )
  );
create policy if not exists tareas_owner_delete on public.tareas
  for delete using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.rol in ('admin','supervisor'))
  );

-- Notas policies
create policy if not exists notas_visibility on public.notas
  for select using (
    usuario_id = auth.uid() or tipo in ('equipo','general') or usuario_asignado = auth.uid() or exists (
      select 1 from public.profiles p where p.id = auth.uid() and p.rol = 'admin'
    )
  );
create policy if not exists notas_insert on public.notas
  for insert with check (
    usuario_id = auth.uid()
  );
create policy if not exists notas_update on public.notas
  for update using (
    usuario_id = auth.uid() or exists (
      select 1 from public.profiles p where p.id = auth.uid() and p.rol = 'admin'
    )
  );
create policy if not exists notas_delete on public.notas
  for delete using (
    usuario_id = auth.uid() or exists (
      select 1 from public.profiles p where p.id = auth.uid() and p.rol = 'admin'
    )
  );

-- Asistencias policies
create policy if not exists asistencias_select on public.asistencias
  for select using (
    usuario_id = auth.uid() or exists (
      select 1 from public.profiles p where p.id = auth.uid() and p.rol in ('admin','supervisor')
    )
  );
create policy if not exists asistencias_insert on public.asistencias
  for insert with check (usuario_id = auth.uid());
create policy if not exists asistencias_update on public.asistencias
  for update using (usuario_id = auth.uid() or exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.rol in ('admin','supervisor')
  ));

-- Reportes policies
create policy if not exists reportes_select on public.reportes
  for select using (
    usuario_id = auth.uid() or exists (
      select 1 from public.profiles p where p.id = auth.uid() and p.rol in ('admin','supervisor')
    )
  );
create policy if not exists reportes_insert on public.reportes
  for insert with check (usuario_id = auth.uid());
create policy if not exists reportes_update on public.reportes
  for update using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.rol in ('admin','supervisor')) or usuario_id = auth.uid()
  );

-- Optional: keep email in profiles synced from auth on sign up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, nombre)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'name', new.email))
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
