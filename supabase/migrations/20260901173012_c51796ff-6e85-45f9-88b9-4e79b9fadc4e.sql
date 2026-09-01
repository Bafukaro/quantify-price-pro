CREATE TABLE public.project_expenses (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id uuid NOT NULL DEFAULT auth.uid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  phase text NOT NULL DEFAULT 'fundacao',
  expense_date date NOT NULL DEFAULT CURRENT_DATE,
  description text NOT NULL DEFAULT '',
  supplier text NOT NULL DEFAULT '',
  invoice_ref text NOT NULL DEFAULT '',
  amount numeric NOT NULL DEFAULT 0,
  note text NOT NULL DEFAULT '',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_expenses TO authenticated;
GRANT ALL ON public.project_expenses TO service_role;

ALTER TABLE public.project_expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners manage their project expenses"
ON public.project_expenses FOR ALL TO authenticated
USING (auth.uid() = owner_id)
WITH CHECK (auth.uid() = owner_id);

CREATE INDEX project_expenses_project_idx ON public.project_expenses (project_id, expense_date DESC);

CREATE TRIGGER update_project_expenses_updated_at
BEFORE UPDATE ON public.project_expenses
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();