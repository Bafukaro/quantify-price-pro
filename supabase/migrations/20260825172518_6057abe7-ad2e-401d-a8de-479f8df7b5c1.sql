CREATE TABLE public.schedule_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL DEFAULT auth.uid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name text NOT NULL,
  phase text NOT NULL DEFAULT 'Estrutura',
  start_week integer NOT NULL DEFAULT 0,
  dur_weeks integer NOT NULL DEFAULT 4,
  target_qty numeric NOT NULL DEFAULT 0,
  unit text NOT NULL DEFAULT 'un',
  planned_pct numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'aberta',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.schedule_tasks TO authenticated;
GRANT ALL ON public.schedule_tasks TO service_role;
ALTER TABLE public.schedule_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners manage their schedule tasks" ON public.schedule_tasks FOR ALL TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE TRIGGER update_schedule_tasks_updated_at BEFORE UPDATE ON public.schedule_tasks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.daily_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL DEFAULT auth.uid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  task_id uuid REFERENCES public.schedule_tasks(id) ON DELETE SET NULL,
  report_date date NOT NULL DEFAULT current_date,
  qty numeric NOT NULL DEFAULT 0,
  approved_qty numeric,
  note text NOT NULL DEFAULT '',
  reporter text NOT NULL DEFAULT '',
  photos jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'pendente',
  reviewed_by text,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.daily_reports TO authenticated;
GRANT ALL ON public.daily_reports TO service_role;
ALTER TABLE public.daily_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners manage their daily reports" ON public.daily_reports FOR ALL TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE TRIGGER update_daily_reports_updated_at BEFORE UPDATE ON public.daily_reports FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();