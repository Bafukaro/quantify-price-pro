CREATE TABLE public.projects (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id uuid NOT NULL DEFAULT auth.uid(),
  legacy_id text,
  name text NOT NULL,
  client text NOT NULL DEFAULT '—',
  location text NOT NULL DEFAULT '—',
  structure_type text,
  phase text NOT NULL DEFAULT 'Fase 0 — Preliminares',
  total_mt numeric NOT NULL DEFAULT 0,
  spent_pct numeric NOT NULL DEFAULT 0,
  alerts integer NOT NULL DEFAULT 0,
  phases jsonb NOT NULL DEFAULT '[]'::jsonb,
  model_path text,
  model_name text,
  model_ext text,
  model_size bigint,
  meshes jsonb NOT NULL DEFAULT '[]'::jsonb,
  overrides jsonb NOT NULL DEFAULT '{}'::jsonb,
  quantities jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX projects_owner_legacy_idx ON public.projects (owner_id, legacy_id) WHERE legacy_id IS NOT NULL;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.projects TO authenticated;
GRANT ALL ON public.projects TO service_role;

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners manage their projects" ON public.projects
  FOR ALL TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_projects_updated_at
BEFORE UPDATE ON public.projects
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();