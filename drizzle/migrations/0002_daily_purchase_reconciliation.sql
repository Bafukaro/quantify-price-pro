ALTER TABLE public.daily_reports ADD COLUMN IF NOT EXISTS purchases jsonb NOT NULL DEFAULT '[]'::jsonb, ADD COLUMN IF NOT EXISTS reconciliation jsonb NOT NULL DEFAULT '[]'::jsonb, ADD COLUMN IF NOT EXISTS submitted_by uuid, ADD COLUMN IF NOT EXISTS review_reason text NOT NULL DEFAULT '';
CREATE TABLE public.project_purchase_catalog (project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE, line_key text NOT NULL, description text NOT NULL, unit text NOT NULL, base_price numeric NOT NULL, market_median numeric, project_revision timestamptz NOT NULL, PRIMARY KEY(project_id,line_key));
GRANT SELECT ON public.project_purchase_catalog TO authenticated;
GRANT ALL ON public.project_purchase_catalog TO service_role;
ALTER TABLE public.project_purchase_catalog ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners read purchase catalog" ON public.project_purchase_catalog FOR SELECT TO authenticated USING (EXISTS(SELECT 1 FROM public.projects p WHERE p.id=project_id AND p.owner_id=auth.uid()));
CREATE OR REPLACE FUNCTION public.purchase_tolerance() RETURNS numeric LANGUAGE sql IMMUTABLE SET search_path=public AS $$ SELECT 0.03::numeric $$;
CREATE OR REPLACE FUNCTION public.sync_purchase_catalog(_project_id uuid,_revision timestamptz,_lines jsonb) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE p public.projects; l jsonb;
BEGIN
 SELECT * INTO p FROM public.projects WHERE id=_project_id AND owner_id=auth.uid() FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Projecto não disponível.'; END IF;
 IF p.updated_at<>_revision THEN RAISE EXCEPTION 'Orçamento alterado. Actualize antes de rever.'; END IF;
 FOR l IN SELECT value FROM jsonb_array_elements(_lines) LOOP
 IF coalesce(l->>'key','')='' OR (l->>'price')::numeric<0 THEN RAISE EXCEPTION 'Artigo inválido.'; END IF;
 INSERT INTO public.project_purchase_catalog VALUES(_project_id,l->>'key',l->>'description',l->>'unit',(l->>'price')::numeric,(l->>'median')::numeric,_revision)
 ON CONFLICT(project_id,line_key) DO UPDATE SET description=EXCLUDED.description,unit=EXCLUDED.unit,base_price=EXCLUDED.base_price,market_median=EXCLUDED.market_median,project_revision=EXCLUDED.project_revision;
 END LOOP;
END $$;
REVOKE ALL ON FUNCTION public.sync_purchase_catalog(uuid,timestamptz,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.sync_purchase_catalog(uuid,timestamptz,jsonb) TO authenticated;
CREATE OR REPLACE FUNCTION public.guard_daily_report() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$
DECLARE l jsonb;
BEGIN
 IF TG_OP='DELETE' THEN RAISE EXCEPTION 'Relatórios não podem ser apagados. Correcções só por novo relatório.'; END IF;
 IF TG_OP='UPDATE' THEN
 IF OLD.status<>'pendente' THEN RAISE EXCEPTION 'Relatório finalizado é imutável. Crie um novo relatório.'; END IF;
 IF (NEW.status,NEW.approved_qty,NEW.reviewed_by,NEW.reviewed_at,NEW.reconciliation,NEW.review_reason) IS DISTINCT FROM (OLD.status,OLD.approved_qty,OLD.reviewed_by,OLD.reviewed_at,OLD.reconciliation,OLD.review_reason) AND current_user<>'postgres' THEN RAISE EXCEPTION 'Use a revisão transaccional do relatório.'; END IF;
 IF NEW.owner_id<>OLD.owner_id OR NEW.project_id<>OLD.project_id OR NEW.submitted_by IS DISTINCT FROM OLD.submitted_by OR NEW.reporter<>OLD.reporter THEN RAISE EXCEPTION 'Autor e projecto não podem mudar.'; END IF;
 ELSE
 IF NEW.status<>'pendente' OR NEW.approved_qty IS NOT NULL OR NEW.reviewed_at IS NOT NULL OR NEW.reviewed_by IS NOT NULL OR NEW.reconciliation<>'[]'::jsonb THEN RAISE EXCEPTION 'Novos relatórios têm de ficar Pendentes.'; END IF;
 NEW.submitted_by:=auth.uid(); NEW.reporter:=coalesce(auth.jwt()->>'email','');
 END IF;
 IF NOT EXISTS(SELECT 1 FROM public.projects WHERE id=NEW.project_id AND owner_id=auth.uid()) THEN RAISE EXCEPTION 'Projecto não disponível.'; END IF;
 IF NEW.task_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.schedule_tasks WHERE id=NEW.task_id AND project_id=NEW.project_id) THEN RAISE EXCEPTION 'Tarefa fora do projecto.'; END IF;
 IF NEW.qty<0 OR jsonb_typeof(NEW.purchases)<>'array' THEN RAISE EXCEPTION 'Relatório inválido.'; END IF;
 FOR l IN SELECT value FROM jsonb_array_elements(NEW.purchases) LOOP
 IF coalesce(l->>'id','')='' OR coalesce(l->>'lineKey','')='' OR coalesce((l->>'quantity')::numeric,0)<=0 OR coalesce((l->>'paidPrice')::numeric,-1)<0 OR coalesce(btrim(l->>'supplier'),'')='' OR coalesce(btrim(l->>'invoice'),'')='' THEN RAISE EXCEPTION 'Compra inválida: indique artigo, quantidade, preço, fornecedor e factura.'; END IF;
 IF coalesce(l->>'receipt','')<>'' AND NOT EXISTS(SELECT 1 FROM storage.objects o WHERE o.bucket_id='reports' AND o.name=l->>'receipt' AND o.name LIKE NEW.owner_id::text||'/'||NEW.project_id::text||'/%') THEN RAISE EXCEPTION 'Comprovativo indisponível ou fora do projecto.'; END IF;
 END LOOP;
 RETURN NEW;
END $$;
CREATE TRIGGER guard_daily_report BEFORE INSERT OR UPDATE OR DELETE ON public.daily_reports FOR EACH ROW EXECUTE FUNCTION public.guard_daily_report();
CREATE OR REPLACE FUNCTION public.review_report_purchases(_id uuid,_status text,_approved_qty numeric,_reason text,_justifications jsonb) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE r public.daily_reports; p public.projects; l jsonb; c public.project_purchase_catalog; price numeric; diff numeric; pct numeric; mismatch boolean; just text; results jsonb:='[]'; value_text text; actor text; submitter text;
BEGIN
 SELECT * INTO r FROM public.daily_reports WHERE id=_id AND owner_id=auth.uid() FOR UPDATE;
 IF NOT FOUND OR r.status<>'pendente' THEN RAISE EXCEPTION 'Relatório indisponível ou já revisto.'; END IF;
 SELECT * INTO p FROM public.projects WHERE id=r.project_id AND owner_id=auth.uid() FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Projecto não disponível.'; END IF;
 IF _status NOT IN ('confirmado','rejeitado') OR _approved_qty<0 OR char_length(btrim(coalesce(_reason,'')))<10 THEN RAISE EXCEPTION 'Indique decisão, quantidade válida e justificação de pelo menos 10 caracteres.'; END IF;
 actor:=coalesce(auth.jwt()->>'email',''); submitter:=coalesce(nullif(r.reporter,''),r.owner_id::text);
 IF coalesce(r.submitted_by,r.owner_id)=auth.uid() THEN actor:=actor||' (mesma pessoa que submeteu; perfis ainda não activos)'; END IF;
 IF _status='confirmado' THEN
 FOR l IN SELECT value FROM jsonb_array_elements(r.purchases) LOOP
 SELECT * INTO c FROM public.project_purchase_catalog WHERE project_id=p.id AND line_key=l->>'lineKey';
 IF NOT FOUND OR c.project_revision<>p.updated_at THEN RAISE EXCEPTION 'Orçamento alterado ou artigo indisponível. Actualize a revisão.'; END IF;
 price:=coalesce((p.price_overrides->(l->>'lineKey')->>'price')::numeric,c.base_price);
 diff:=(price-(l->>'paidPrice')::numeric)*(l->>'quantity')::numeric;
 pct:=CASE WHEN price=0 THEN CASE WHEN (l->>'paidPrice')::numeric=0 THEN 0 ELSE NULL END ELSE ((l->>'paidPrice')::numeric-price)/price*100 END;
 mismatch:=CASE WHEN price=0 THEN (l->>'paidPrice')::numeric<>0 ELSE abs((l->>'paidPrice')::numeric-price)>price*public.purchase_tolerance() END;
 just:=btrim(coalesce(_justifications->>(l->>'id'),''));
 IF mismatch AND char_length(just)<30 THEN RAISE EXCEPTION 'Diferença a esclarecer: justificação de pelo menos 30 caracteres por linha.'; END IF;
 value_text:=CASE WHEN mismatch THEN '⚠ NÃO BATE: ' ELSE 'BATE: ' END||'BoQ '||price||', pago '||(l->>'paidPrice')||', '||(l->>'quantity')||' '||c.unit||', diferença '||diff||' MT · pago '||CASE WHEN diff>=0 THEN 'abaixo' ELSE 'acima' END||' do orçado · '||CASE WHEN coalesce(l->>'receipt','')='' THEN 'Sem comprovativo' ELSE 'Com comprovativo' END||' · submeteu: '||submitter||' · confirmou: '||actor;
 results:=results||jsonb_build_array(jsonb_build_object('id',l->>'id','lineKey',l->>'lineKey','description',c.description,'unit',c.unit,'boqPrice',price,'paidPrice',(l->>'paidPrice')::numeric,'quantity',(l->>'quantity')::numeric,'median',c.market_median,'difference',diff,'percent',pct,'mismatch',mismatch,'receipt',coalesce(l->>'receipt',''),'justification',CASE WHEN mismatch THEN just ELSE btrim(_reason) END));
 INSERT INTO public.audit_log(project_id,user_id,user_email,action,entity,old_value,new_value,delta,justification) VALUES(p.id,auth.uid(),coalesce(auth.jwt()->>'email',''),'despesa','Compra — '||c.description,'Pendente',value_text,coalesce(pct,0),CASE WHEN mismatch THEN just ELSE btrim(_reason) END);
 END LOOP;
 END IF;
 INSERT INTO public.audit_log(project_id,user_id,user_email,action,entity,old_value,new_value,justification) VALUES(p.id,auth.uid(),coalesce(auth.jwt()->>'email',''),'progresso','Relatório diário — '||r.report_date,'Pendente',_status||' · submeteu: '||submitter||' · reviu: '||actor,btrim(_reason));
 UPDATE public.daily_reports SET status=_status,approved_qty=CASE WHEN _status='confirmado' THEN _approved_qty ELSE 0 END,reviewed_by=actor,reviewed_at=now(),review_reason=btrim(_reason),reconciliation=results WHERE id=_id;
END $$;
REVOKE ALL ON FUNCTION public.review_report_purchases(uuid,text,numeric,text,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.review_report_purchases(uuid,text,numeric,text,jsonb) TO authenticated;
CREATE POLICY "Report files require project ownership" ON storage.objects AS RESTRICTIVE FOR INSERT TO authenticated WITH CHECK(bucket_id<>'reports' OR EXISTS(SELECT 1 FROM public.projects p WHERE p.id::text=(storage.foldername(name))[2] AND p.owner_id=auth.uid()));
CREATE POLICY "Preserve attached report receipts" ON storage.objects AS RESTRICTIVE FOR DELETE TO authenticated USING(bucket_id<>'reports' OR NOT EXISTS(SELECT 1 FROM public.daily_reports r CROSS JOIN LATERAL jsonb_array_elements(r.purchases) l WHERE l->>'receipt'=name));