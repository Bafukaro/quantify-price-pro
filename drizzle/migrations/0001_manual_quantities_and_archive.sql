ALTER TABLE public.projects ADD COLUMN archived boolean NOT NULL DEFAULT false, ADD COLUMN quantity_source text NOT NULL DEFAULT 'auto', ADD COLUMN manual_lines jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.audit_log ADD CONSTRAINT audit_log_project_preserve_fk FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE RESTRICT NOT VALID;
CREATE OR REPLACE FUNCTION public.save_manual_line(_project_id uuid, _line jsonb, _justification text) RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE p public.projects; old_line jsonb; next_lines jsonb;
BEGIN
 IF char_length(btrim(coalesce(_justification,''))) < 10 THEN RAISE EXCEPTION 'Justificação obrigatória (mínimo 10 caracteres).'; END IF;
 SELECT * INTO p FROM public.projects WHERE id = _project_id AND owner_id = auth.uid() FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Projecto não disponível.'; END IF;
 IF p.model_path IS NOT NULL OR jsonb_array_length(p.meshes) > 0 THEN RAISE EXCEPTION 'A inserção manual só está disponível sem modelo 3D.'; END IF;
 IF coalesce(_line->>'id','') = '' OR coalesce(btrim(_line->>'description'),'') = '' OR coalesce(btrim(_line->>'unit'),'') = '' OR coalesce(_line->>'phase','') NOT IN ('fundacao','pilares','lajes','alvenaria','cobertura','instalacoes','acabamentos') OR coalesce((_line->>'quantity')::numeric,-1) < 0 THEN RAISE EXCEPTION 'Linha manual inválida.'; END IF;
 SELECT value INTO old_line FROM jsonb_array_elements(p.manual_lines) WHERE value->>'id' = _line->>'id';
 IF old_line IS NOT NULL THEN
 SELECT jsonb_agg(CASE WHEN value->>'id' = _line->>'id' THEN _line ELSE value END) INTO next_lines FROM jsonb_array_elements(p.manual_lines);
 ELSE next_lines := p.manual_lines || jsonb_build_array(_line); END IF;
 INSERT INTO public.audit_log(project_id,user_id,user_email,action,entity,old_value,new_value,justification) VALUES (_project_id,auth.uid(),coalesce(auth.jwt()->>'email',''),'quantidade',CASE WHEN old_line IS NULL THEN 'Linha manual adicionada — ' ELSE 'Linha manual alterada — ' END || (_line->>'description'),coalesce(old_line::text,'—'),_line::text,btrim(_justification));
 UPDATE public.projects SET quantity_source='manual',manual_lines=next_lines WHERE id=_project_id;
END; $$;
REVOKE ALL ON FUNCTION public.save_manual_line(uuid,jsonb,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.save_manual_line(uuid,jsonb,text) TO authenticated;
CREATE OR REPLACE FUNCTION public.validate_manual_audit() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$ BEGIN
 IF NEW.action='quantidade' AND char_length(btrim(coalesce(NEW.justification,'')))<10 THEN RAISE EXCEPTION 'Justificação obrigatória (mínimo 10 caracteres).'; END IF;
 RETURN NEW; END; $$;
CREATE TRIGGER validate_manual_audit BEFORE INSERT ON public.audit_log FOR EACH ROW EXECUTE FUNCTION public.validate_manual_audit();