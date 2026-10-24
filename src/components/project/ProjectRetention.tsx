import { useState } from "react";
import { Archive, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { archiveProject, deleteProject, type Project } from "@/data/projects";

export default function ProjectRetention({ project }: { project: Project }) {
  const [hasAudit, setHasAudit] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const navigate = useNavigate();
  const prepare = async () => {
    setBusy(true); setError(null);
    const { count, error: err } = await supabase.from("audit_log").select("id", { count: "exact", head: true }).eq("project_id", project.id);
    setBusy(false);
    if (err) return setError(err.message);
    setHasAudit((count ?? 0) > 0); setConfirm(true);
  };
  const act = async () => {
    setBusy(true);
    const err = hasAudit ? await archiveProject(project.id) : await deleteProject(project.id);
    setBusy(false);
    if (err) { setHasAudit(true); return setError(err); }
    navigate("/app");
  };
  if (project.archived) return <span className="text-sm text-muted-foreground">Arquivado · Audit Log preservado</span>;
  return <div className="space-y-2">
    {!confirm ? <Button variant="outline" size="sm" disabled={busy} onClick={() => void prepare()}><Archive /> Arquivar / apagar</Button> : <>
      <p className="text-sm text-muted-foreground">{hasAudit ? "Este projecto tem Audit Log. O histórico será preservado em Arquivados." : "Sem entradas no Audit Log. Confirmar eliminação do projecto?"}</p>
      <div className="flex gap-2"><Button variant={hasAudit ? "outline" : "destructive"} size="sm" disabled={busy} onClick={() => void act()}>{hasAudit ? <Archive /> : <Trash2 />}{hasAudit ? "Arquivar" : "Apagar"}</Button><Button variant="ghost" size="sm" disabled={busy} onClick={() => setConfirm(false)}>Cancelar</Button></div>
    </>}
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
  </div>;
}