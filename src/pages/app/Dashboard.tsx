import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { fmtMT } from "@/data/mock";
import { AlertTriangle, ArrowUpRight, Plus, Building2, Wallet, ScrollText, Upload, X, Box } from "lucide-react";
import { useAudit, useProjects, addProject, setProjectModel, useProjectModel } from "@/data/store";

export default function Dashboard() {
  const projects = useProjects();
  const totalGerido = projects.reduce((a, p) => a + p.totalMT, 0);
  const totalAlertas = projects.reduce((a, p) => a + p.alerts, 0);
  const audit = useAudit();
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Alerts strip */}
      <div className="flex items-start gap-3 p-4 rounded-lg border border-warning/40 bg-warning/10">
        <AlertTriangle className="size-5 text-warning shrink-0 mt-0.5" />
        <div className="flex-1 text-sm">
          <span className="font-medium text-foreground">3 materiais com desvio &gt;15%</span>
          <span className="text-muted-foreground"> — Aço A500, Cabo XV 3x2.5, Chapa lacada cobertura.</span>
        </div>
        <Link to="/app/precos" className="text-sm font-medium text-accent hover:underline shrink-0">
          Ver detalhes →
        </Link>
      </div>

      {/* KPIs */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi icon={Building2} label="Projectos activos" value={String(projects.length)} delta="+1 este mês" />
        <Kpi icon={Wallet} label="Valor total gerido" value={fmtMT(totalGerido)} delta="MZN" />
        <Kpi icon={AlertTriangle} label="Alertas activos" value={String(totalAlertas)} delta="Desvios >15%" warn />
        <Kpi icon={ScrollText} label="Alterações auditadas" value={String(audit.length)} delta="Registadas no log" />
      </div>

      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl">Obras em curso</h2>
          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:opacity-90 shadow-soft"
          >
            <Plus className="size-4" /> Novo projecto
          </button>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {projects.map((p) => (
          <Link
            key={p.id}
            to={`/app/projecto/${p.id}`}
            className="group p-6 rounded-xl bg-surface-elevated border border-border shadow-soft hover:shadow-elegant transition-shadow"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                  {p.location}
                </div>
                <h3 className="font-display text-xl mt-1 group-hover:text-accent transition-colors">
                  {p.name}
                </h3>
                <div className="text-sm text-muted-foreground mt-1">{p.client}</div>
              </div>
              <div className="flex items-center gap-2">
                <ModelBadge projectId={p.id} />
                <ArrowUpRight className="size-5 text-muted-foreground group-hover:text-accent transition" />
              </div>
            </div>

            <div className="mt-5 flex items-end justify-between">
              <div>
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Valor total</div>
                <div className="font-display text-2xl">{fmtMT(p.totalMT)}</div>
              </div>
              <div className="text-right">
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Executado</div>
                <div className="font-mono text-lg">{p.spentPct}%</div>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{p.phase}</span>
                {p.alerts > 0 && (
                  <span className="inline-flex items-center gap-1 text-warning">
                    <AlertTriangle className="size-3" /> {p.alerts} alertas
                  </span>
                )}
              </div>
              <div className="flex gap-1 h-2">
                {p.phases.map((ph) => (
                  <div key={ph.name} className="flex-1 rounded-sm bg-muted overflow-hidden" title={`${ph.name} ${ph.pct}%`}>
                    <div
                      className="h-full bg-accent"
                      style={{ width: `${ph.pct}%` }}
                    />
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-[10px] text-muted-foreground uppercase tracking-wider">
                {p.phases.map((ph) => (
                  <span key={ph.name} className="flex-1 truncate">{ph.name.slice(0, 4)}.</span>
                ))}
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-border text-xs text-muted-foreground">
              Última actualização · {p.updatedAt}
            </div>
          </Link>
          ))}
        </div>
      </div>

      {modalOpen && <NewProjectModal onClose={() => setModalOpen(false)} />}
    </div>
  );
}

function ModelBadge({ projectId }: { projectId: string }) {
  const m = useProjectModel(projectId);
  if (!m) return null;
  return (
    <span
      title={`Modelo 3D carregado · ${m.name}`}
      className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded bg-accent/10 text-accent uppercase tracking-wider"
    >
      <Box className="size-3" /> 3D
    </span>
  );
}

function Kpi({ icon: Icon, label, value, delta, warn = false }: any) {
  return (
    <div className="p-5 rounded-xl bg-surface-elevated border border-border shadow-soft">
      <div className="flex items-center justify-between">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
        <Icon className={`size-4 ${warn ? "text-warning" : "text-accent"}`} />
      </div>
      <div className="font-display text-3xl mt-3">{value}</div>
      <div className="text-xs text-muted-foreground mt-1">{delta}</div>
    </div>
  );
}

function NewProjectModal({ onClose }: { onClose: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [client, setClient] = useState("");
  const [location, setLocation] = useState("");
  const [budget, setBudget] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setErr("Nome obrigatório."); return; }
    const id = addProject({
      name: name.trim(),
      client: client.trim(),
      location: location.trim(),
      totalMT: Number(budget) || 0,
    });
    if (file) {
      const lower = file.name.toLowerCase();
      let ext: "gltf" | "glb" | "obj" | "ifc" | null = null;
      if (lower.endsWith(".glb")) ext = "glb";
      else if (lower.endsWith(".gltf")) ext = "gltf";
      else if (lower.endsWith(".obj")) ext = "obj";
      else if (lower.endsWith(".ifc")) ext = "ifc";
      if (ext && file.size > 0) {
        const url = URL.createObjectURL(file);
        setProjectModel(id, { url, ext, name: file.name, size: file.size, meshes: [] });
      }
    }
    onClose();
    navigate(`/app/projecto/${id}?tab=vista3d`);
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-surface-elevated rounded-xl shadow-elegant w-full max-w-lg border border-border">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h3 className="font-display text-xl">Novo projecto</h3>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-muted"><X className="size-4" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <Field label="Nome do projecto" placeholder="Ex: Edifício Residencial XYZ" value={name} onChange={(e:any)=>setName(e.target.value)} />
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Cliente" placeholder="Empresa / instituição" value={client} onChange={(e:any)=>setClient(e.target.value)} />
            <Field label="Localização" placeholder="Cidade · Bairro" value={location} onChange={(e:any)=>setLocation(e.target.value)} />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <SelectField label="Tipo de estrutura" options={["Betão armado", "Estrutura metálica", "Mista", "Alvenaria estrutural"]} />
            <Field label="Orçamento estimado (MT)" type="number" placeholder="0" value={budget} onChange={(e:any)=>setBudget(e.target.value)} />
          </div>
          <div>
            <label className="text-xs uppercase tracking-wider text-muted-foreground">Modelo 3D (.ifc / .gltf / .glb / .obj)</label>
            <label className="mt-2 flex items-center justify-center gap-2 px-4 py-6 rounded-md border-2 border-dashed border-border bg-muted/30 hover:bg-muted/50 cursor-pointer text-sm text-muted-foreground transition">
              <Upload className="size-4" />
              {file ? `${file.name} (${(file.size/1024).toFixed(0)} KB)` : "Carregar modelo IFC / GLTF / OBJ (opcional)"}
              <input
                type="file"
                accept=".ifc,.gltf,.glb,.obj"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </label>
          </div>
          {err && <div className="text-xs text-destructive">{err}</div>}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-md border border-border text-sm hover:bg-muted">
              Cancelar
            </button>
            <button type="submit" className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90">
              Criar projecto
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, ...rest }: any) {
  return (
    <div>
      <label className="text-xs uppercase tracking-wider text-muted-foreground">{label}</label>
      <input
        {...rest}
        className="mt-1.5 w-full px-3 py-2 rounded-md border border-border bg-background text-sm focus:outline-none focus:border-accent"
      />
    </div>
  );
}

function SelectField({ label, options }: { label: string; options: string[] }) {
  return (
    <div>
      <label className="text-xs uppercase tracking-wider text-muted-foreground">{label}</label>
      <select className="mt-1.5 w-full px-3 py-2 rounded-md border border-border bg-background text-sm focus:outline-none focus:border-accent">
        {options.map((o) => <option key={o}>{o}</option>)}
      </select>
    </div>
  );
}