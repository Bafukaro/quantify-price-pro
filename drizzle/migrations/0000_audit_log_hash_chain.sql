CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

CREATE TABLE public.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seq bigserial NOT NULL UNIQUE,
  project_id uuid NOT NULL,
  user_id uuid NOT NULL DEFAULT auth.uid(),
  user_email text NOT NULL DEFAULT '',
  action text NOT NULL,
  entity text NOT NULL DEFAULT '',
  old_value text NOT NULL DEFAULT '',
  new_value text NOT NULL DEFAULT '',
  delta numeric NOT NULL DEFAULT 0,
  justification text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  prev_hash text NOT NULL DEFAULT '',
  hash text NOT NULL DEFAULT ''
);
CREATE INDEX audit_log_project_seq_idx ON public.audit_log (project_id, seq);

GRANT SELECT, INSERT ON public.audit_log TO authenticated;
GRANT USAGE ON SEQUENCE public.audit_log_seq_seq TO authenticated;
GRANT ALL ON public.audit_log TO service_role;

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Project owners read audit log" ON public.audit_log
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.owner_id = auth.uid()));

CREATE POLICY "Project owners append audit log" ON public.audit_log
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.owner_id = auth.uid()));

CREATE OR REPLACE FUNCTION public.audit_log_compute_hash(
  _prev text, _project uuid, _user uuid, _action text, _entity text,
  _old text, _new text, _just text, _at timestamptz)
RETURNS text
LANGUAGE sql IMMUTABLE
SET search_path = public, extensions
AS $$
  SELECT encode(extensions.digest(
    coalesce(_prev,'') || _project::text || _user::text || _action || _entity ||
    _old || _new || _just || to_char(_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),
    'sha256'), 'hex')
$$;

CREATE OR REPLACE FUNCTION public.audit_log_before_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  last_hash text;
BEGIN
  IF auth.uid() IS NOT NULL THEN
    NEW.user_id := auth.uid();
  END IF;
  NEW.created_at := now();
  NEW.entity := coalesce(NEW.entity, '');
  NEW.old_value := coalesce(NEW.old_value, '');
  NEW.new_value := coalesce(NEW.new_value, '');
  NEW.justification := btrim(coalesce(NEW.justification, ''));

  IF NEW.action IN ('preco', 'despesa', 'progresso') AND char_length(NEW.justification) < 10 THEN
    RAISE EXCEPTION 'Justificação obrigatória: mínimo 10 caracteres para a acção "%".', NEW.action
      USING ERRCODE = 'check_violation';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtext(NEW.project_id::text));
  SELECT a.hash INTO last_hash FROM public.audit_log a
    WHERE a.project_id = NEW.project_id ORDER BY a.seq DESC LIMIT 1;

  NEW.prev_hash := coalesce(last_hash, '');
  NEW.hash := public.audit_log_compute_hash(NEW.prev_hash, NEW.project_id, NEW.user_id,
    NEW.action, NEW.entity, NEW.old_value, NEW.new_value, NEW.justification, NEW.created_at);
  RETURN NEW;
END;
$$;

CREATE TRIGGER audit_log_before_insert
BEFORE INSERT ON public.audit_log
FOR EACH ROW EXECUTE FUNCTION public.audit_log_before_insert();

CREATE OR REPLACE FUNCTION public.audit_log_block_changes()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  RAISE EXCEPTION 'O Audit Log é imutável: % não é permitido.', TG_OP
    USING ERRCODE = 'insufficient_privilege';
END;
$$;

CREATE TRIGGER audit_log_block_update_delete
BEFORE UPDATE OR DELETE ON public.audit_log
FOR EACH ROW EXECUTE FUNCTION public.audit_log_block_changes();

CREATE TRIGGER audit_log_block_truncate
BEFORE TRUNCATE ON public.audit_log
FOR EACH STATEMENT EXECUTE FUNCTION public.audit_log_block_changes();

CREATE OR REPLACE FUNCTION public.verify_audit_chain(_project_id uuid)
RETURNS TABLE (intact boolean, total integer, broken_id uuid, broken_seq bigint, message text)
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public, extensions
AS $$
DECLARE
  r record;
  expected_prev text := '';
  n integer := 0;
BEGIN
  FOR r IN SELECT * FROM public.audit_log a WHERE a.project_id = _project_id ORDER BY a.seq LOOP
    n := n + 1;
    IF r.prev_hash <> expected_prev THEN
      RETURN QUERY SELECT false, n, r.id, r.seq, format('Entrada #%s quebrada: ligação à anterior não corresponde.', n);
      RETURN;
    END IF;
    IF r.hash <> public.audit_log_compute_hash(r.prev_hash, r.project_id, r.user_id, r.action, r.entity,
         r.old_value, r.new_value, r.justification, r.created_at) THEN
      RETURN QUERY SELECT false, n, r.id, r.seq, format('Entrada #%s quebrada: conteúdo não corresponde ao hash.', n);
      RETURN;
    END IF;
    expected_prev := r.hash;
  END LOOP;
  RETURN QUERY SELECT true, n, NULL::uuid, NULL::bigint, format('íntegro (%s entradas verificadas)', n);
END;
$$;

GRANT EXECUTE ON FUNCTION public.verify_audit_chain(uuid) TO authenticated;