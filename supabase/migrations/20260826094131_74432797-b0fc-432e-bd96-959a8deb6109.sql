ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS price_overrides jsonb NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.schedule_tasks ADD COLUMN IF NOT EXISTS kind text NOT NULL DEFAULT 'trabalho';
ALTER TABLE public.schedule_tasks ADD COLUMN IF NOT EXISTS critical boolean NOT NULL DEFAULT false;