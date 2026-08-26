import { useParams, useSearchParams } from "react-router-dom";
import { useState, useEffect, useMemo, Fragment } from "react";
import { fmtMT } from "@/data/mock";
import {
  Download,
  FileSpreadsheet,
  AlertTriangle,
  Bell,
  ShieldCheck,
  Calculator,
  FileText,
  ScrollText,
  Layers,
  TrendingDown,
  Pencil,
  Check,
  X,
  Store,
} from "lucide-react";
import { getStats, setPriceCity, materials, findMaterialFuzzy, RISK_LABEL, RISK_COLOR } from "@/data/priceDb";
import type { PhaseKey } from "@/components/three/BuildingModel";
import { useAudit, useProjects, useProjectMeshes, useProjectOverrides, useProjectRebar, useProjectElementGroups, setProjectPhasePct, pushAudit, auditStamp, currentAuditUser } from "@/data/store";
import { setProjectPriceOverride, useProjectPriceOverrides, type PriceOverride } from "@/data/projects";
import { exportBoQPDF, exportBoQExcel } from "@/lib/exports";
import { buildBoQSource, boqGrandTotal, boqLineKey, boqDetailMatKey, type BoQSource } from "@/lib/boqSource";
import { buildDetailedBoQ, type DetailedPhase } from "@/lib/detailedBoq";
import type { Project as ProjectRecord } from "@/data/projects";
import Model3D from "@/pages/app/Model3D";
import Cronograma from "@/components/schedule/Cronograma";

type TabKey = "resumo" | "vista3d" | "calculos" | "orcamento" | "cronograma" | "auditlog" | "relatorio";
const TABS: { key: TabKey; label: string }[] = [
  { key: "resumo", label: "Resumo" },
  { key: "vista3d", label: "Vista 3D" },
  { key: "calculos", label: "Cálculos" },
  { key: "orcamento", label: "Orçamento" },
  { key: "cronograma", label: "Cronograma" },
  { key: "auditlog", label: "Audit Log" },
  { key: "relatorio", label: "Relatório" },
];

export default function Project() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const projects = useProjects();
  const project = projects.find((p) => p.id === id) ?? projects[0];
  const meshes = useProjectMeshes(project?.id ?? "");
  const overrides = useProjectOverrides(project?.id ?? "");
  const rebar = useProjectRebar(project?.id ?? "");
  const priceOverrides = useProjectPriceOverrides(project?.id ?? "");
  // Preços resolvidos pela localização do projecto (Maputo vs Lichinga, etc.)
  setPriceCity(project?.location);
  const [active, setActive] = useState<TabKey>("resumo");
  // Clique num elemento 3D → destacar a secção correspondente no Orçamento.
  const [boqHighlight, setBoqHighlight] = useState<{ phase: PhaseKey; ts: number } | null>(null);
  useEffect(() => {
    const t = params.get("tab") as TabKey | null;
    if (t && TABS.some((x) => x.key === t)) setActive(t);
  }, [params]);
  const ivaPct = 0.17;
  const contPct = 0.1;

  // Fonte única do BoQ — a mesma que alimenta o ecrã e as exportações.
  const boq = useMemo(
    () => buildBoQSource({ location: project?.location, meshes, overrides, rebar, priceOverrides }),
    [project?.location, meshes, overrides, rebar, priceOverrides]
  );
  const editedPrices = Object.keys(priceOverrides).length;
  // Badge do Audit Log: entradas das últimas 24h.
  const auditEntries = useAudit();
  const audit24h = useMemo(() => {
    const cutoff = Date.now() - 24 * 3600 * 1000;
    return auditEntries.filter((e) => new Date(e.dt.replace(" ", "T")).getTime() >= cutoff).length;
  }, [auditEntries]);

  if (!project) {
    return (
      <div className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
        Projecto não encontrado. Volte ao Dashboard.
      </div>
    );
  }

  const total = boqGrandTotal(boq);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Project header */}
      <div className="p-6 rounded-xl bg-surface-elevated border border-border shadow-soft">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
              {project.location} · {project.client}
            </div>
            <h2 className="font-display text-3xl mt-1">{project.name}</h2>
            <div className="text-sm text-muted-foreground mt-1">
              Fase actual: <span className="text-foreground font-medium">{project.phase}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => exportBoQExcel(project.name, boq)} className="inline-flex items-center gap-2 border border-border px-4 py-2 rounded-md text-sm hover:bg-muted">
              <FileSpreadsheet className="size-4" /> Exportar Excel
            </button>
            <button onClick={() => exportBoQPDF(project.name, boq)} className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:opacity-90">
              <Download className="size-4" /> Exportar PDF
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 border-b border-border">
        {TABS.map((t) => (
          <TabBtn
            key={t.key}
            label={t.label}
            active={active === t.key}
            onClick={() => setActive(t.key)}
            badge={
              t.key === "orcamento" && editedPrices > 0
                ? `${editedPrices} preços editados`
                : t.key === "auditlog" && audit24h > 0
                ? `${audit24h} / 24h`
                : undefined
            }
          />
        ))}
      </div>

      {active === "resumo" && <ResumoView project={project} boq={boq} total={total} />}
      {active === "vista3d" && (
        <Model3D
          projectId={project.id}
          onBoQNavigate={(phase) => {
            setBoqHighlight({ phase, ts: Date.now() });
            setActive("orcamento");
          }}
        />
      )}
      {active === "calculos" && <CalculosView />}
      {active === "orcamento" && <OrcamentoView ivaPct={ivaPct} contPct={contPct} projectName={project.name} projectId={project.id} boq={boq} priceOverrides={priceOverrides} highlight={boqHighlight} />}
      {active === "cronograma" && <CronogramaView project={project} />}
      {active === "auditlog" && <AuditLogView projectName={project.name} />}
      {active === "relatorio" && <RelatorioView project={project} boq={boq} total={total} ivaPct={ivaPct} contPct={contPct} />}
    </div>
  );
}

function TabBtn({ label, active, onClick, badge }: { label: string; active: boolean; onClick: () => void; badge?: string }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition inline-flex items-center gap-2 ${
        active ? "border-accent text-accent" : "border-transparent text-muted-foreground hover:text-foreground"
      }`}
    >
      {label}
      {badge && (
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/15 text-accent font-medium">{badge}</span>
      )}
    </button>
  );
}

function Total({ label, value, highlight = false }: any) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`font-display ${highlight ? "text-2xl text-accent" : "text-lg"}`}>{value}</div>
    </div>
  );
}

// ===================== RESUMO =====================
function ResumoView({ project, boq, total }: { project: ProjectRecord; boq: BoQSource; total: number }) {
  const max = Math.max(...boq.order.map((p) => boq.sections[p].total), 1);
  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-5">
        <div className="p-6 rounded-xl bg-surface-elevated border border-border shadow-soft">
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Valor do orçamento</div>
          <div className="font-display text-3xl mt-2">{fmtMT(total)}</div>
          <div className="text-xs text-muted-foreground mt-1">{boq.originLabel}</div>
        </div>
        <div className="p-6 rounded-xl bg-surface-elevated border border-border shadow-soft">
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-muted-foreground">
            <Bell className="size-3.5" /> Alertas activos de preço
          </div>
          <div className="font-display text-5xl mt-2 text-warning">{project.alerts}</div>
          <div className="text-xs text-muted-foreground mt-1">Materiais com desvio &gt;15% face à mediana de mercado</div>
        </div>
      </div>

      <div className="p-6 rounded-xl bg-surface-elevated border border-border shadow-soft">
        <h3 className="font-display text-lg mb-4">Custo por fase</h3>
        <div className="space-y-3">
          {boq.order.map((p) => {
            const sec = boq.sections[p];
            return (
              <div key={p} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">{sec.label}</span>
                  <span className="font-mono">{fmtMT(sec.total)}</span>
                </div>
                <div className="h-2.5 rounded bg-muted overflow-hidden">
                  <div className="h-full bg-accent" style={{ width: `${(sec.total / max) * 100}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <SupplierComparison boq={boq} />
    </div>
  );
}

/** Comparação entre fornecedores actuais — min / mediana / máx, com a melhor opção disponível. */
function SupplierComparison({ boq }: { boq: BoQSource }) {
  const rows = useMemo(() => {
    const qtyById = new Map<string, number>();
    boq.order.forEach((p) =>
      boq.sections[p].lines.forEach((l) => {
        if (!l.materialId) return;
        qtyById.set(l.materialId, (qtyById.get(l.materialId) ?? 0) + l.qty);
      })
    );
    return [...qtyById.entries()]
      .map(([materialId, qty]) => {
        const st = getStats(materialId);
        if (!st || st.prices.length < 2) return null;
        const best = st.byQuote.reduce((a, b) => (b.quote.price < a.quote.price ? b : a));
        return {
          materialId,
          name: st.material.name,
          unit: st.material.unit,
          qty,
          min: st.min,
          median: st.median,
          max: st.max,
          spreadPct: st.spreadPct,
          bestSupplier: best.supplier,
          saving: Math.max(0, (st.median - st.min) * qty),
        };
      })
      .filter(Boolean)
      .sort((a: any, b: any) => b.saving - a.saving) as any[];
  }, [boq]);

  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
        Sem dados de comparação entre fornecedores para os materiais deste orçamento.
      </div>
    );
  }

  const totalSaving = rows.reduce((a, r) => a + r.saving, 0);

  return (
    <div className="rounded-xl bg-surface-elevated border border-border shadow-soft overflow-hidden">
      <div className="px-5 py-3 border-b border-border flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <TrendingDown className="size-4 text-success" />
          <span className="font-display text-base">Comparação entre fornecedores actuais</span>
        </div>
        <div className="text-xs text-muted-foreground">
          Poupança potencial escolhendo a melhor opção: <span className="font-mono text-success">{fmtMT(totalSaving)}</span>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/60 text-muted-foreground text-xs uppercase tracking-wider">
            <tr>
              <th className="px-4 py-3 text-left">Material</th>
              <th className="px-4 py-3 text-right">Qtd</th>
              <th className="px-4 py-3 text-right">Mín</th>
              <th className="px-4 py-3 text-right">Mediana</th>
              <th className="px-4 py-3 text-right">Máx</th>
              <th className="px-4 py-3 text-right">Spread</th>
              <th className="px-4 py-3 text-left">Melhor opção</th>
              <th className="px-4 py-3 text-right">Poupança</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((r) => (
              <tr key={r.materialId} className="hover:bg-muted/30">
                <td className="px-4 py-3">{r.name}</td>
                <td className="px-4 py-3 text-right font-mono">
                  {r.qty.toLocaleString("pt-PT", { maximumFractionDigits: 1 })} {r.unit}
                </td>
                <td className="px-4 py-3 text-right font-mono text-success">{Math.round(r.min).toLocaleString("pt-PT")}</td>
                <td className="px-4 py-3 text-right font-mono">{Math.round(r.median).toLocaleString("pt-PT")}</td>
                <td className="px-4 py-3 text-right font-mono text-muted-foreground">{Math.round(r.max).toLocaleString("pt-PT")}</td>
                <td className={`px-4 py-3 text-right font-mono ${r.spreadPct > 20 ? "text-destructive" : "text-muted-foreground"}`}>
                  {r.spreadPct.toFixed(0)}%
                </td>
                <td className="px-4 py-3">
                  {r.bestSupplier?.name ?? "—"}
                  <span className={`ml-2 text-[10px] px-1.5 py-0.5 rounded-full ${r.bestSupplier?.type === "formal" ? "bg-accent/10 text-accent" : "bg-warning/10 text-warning"}`}>
                    {r.bestSupplier?.type === "formal" ? "Formal" : "Informal"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right font-mono font-medium text-success">
                  {Math.round(r.saving).toLocaleString("pt-PT")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ===================== CÁLCULOS (REBAP) =====================
const REBAP_CHECKS: Array<{
  phase: string;
  items: { titulo: string; valor: string; norma: string; ok: boolean }[];
}> = [
  {
    phase: "Fase 1 — Estrutura · Fundações",
    items: [
      { titulo: "Armadura longitudinal mínima (sapatas)", valor: "Ø10 // 0.15 m — As = 5.24 cm²/m", norma: "REBAP Art. 89 — mín. 0.10% da secção", ok: true },
      { titulo: "Espaçamento mínimo entre varões", valor: "12 cm", norma: "REBAP Art. 78 — ≥ 1.5×Ømáx, mín. 4 cm", ok: true },
      { titulo: "Classe de betão em fundações", valor: "C25/30", norma: "REBAP Art. 13 — mín. C20/25 em meio agressivo", ok: true },
      { titulo: "Recobrimento das armaduras", valor: "4 cm", norma: "REBAP Art. 81 — mín. 3.5 cm em contacto com terreno", ok: true },
    ],
  },
  {
    phase: "Fase 1 — Estrutura · Pilares",
    items: [
      { titulo: "Taxa geométrica de armadura longitudinal", valor: "ρ = 1.2%", norma: "REBAP Art. 121 — 0.8% ≤ ρ ≤ 6%", ok: true },
      { titulo: "Estribos — diâmetro", valor: "Ø8 mm", norma: "REBAP Art. 122 — ≥ Ømáx/4 e ≥ 6 mm", ok: true },
      { titulo: "Espaçamento de estribos", valor: "15 cm", norma: "REBAP Art. 122 — ≤ 12·Ømin = 12 cm", ok: false },
      { titulo: "Classe de betão pilares", valor: "C25/30", norma: "REBAP Art. 13 — mín. C20/25", ok: true },
    ],
  },
  {
    phase: "Fase 1 — Estrutura · Lajes",
    items: [
      { titulo: "Espessura mínima laje maciça", valor: "18 cm", norma: "REBAP Art. 102 — L/30 = 16.7 cm", ok: true },
      { titulo: "Armadura de distribuição", valor: "Ø8 // 0.20 m", norma: "REBAP Art. 91 — mín. 20% da principal", ok: true },
      { titulo: "Recobrimento", valor: "2.5 cm", norma: "REBAP Art. 81 — mín. 2.0 cm interior", ok: true },
    ],
  },
  {
    phase: "Fase 2 — Alvenaria",
    items: [
      { titulo: "Argamassa de assentamento", valor: "Traço 1:4 (cimento:areia)", norma: "EN 998-2 — classe M5 mínima", ok: true },
      { titulo: "Espessura juntas", valor: "1.0 cm", norma: "Boa prática — 0.8 a 1.2 cm", ok: true },
    ],
  },
];

function CalculosView() {
  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3 p-4 rounded-lg border border-accent/30 bg-accent/5">
        <ShieldCheck className="size-5 text-accent mt-0.5 shrink-0" />
        <div className="text-sm">
          <div className="font-medium">Cálculos estruturais — validação automática REBAP</div>
          <div className="text-muted-foreground text-xs mt-0.5">
            Cada resultado é confrontado com a norma aplicável. Itens fora de norma são sinalizados a vermelho.
          </div>
        </div>
      </div>
      {REBAP_CHECKS.map((g) => (
        <div key={g.phase} className="rounded-xl bg-surface-elevated border border-border shadow-soft overflow-hidden">
          <div className="px-5 py-3 bg-muted/40 border-b border-border flex items-center gap-2">
            <Calculator className="size-4 text-muted-foreground" />
            <span className="font-display text-base">{g.phase}</span>
          </div>
          <ul className="divide-y divide-border">
            {g.items.map((it) => (
              <li key={it.titulo} className="px-5 py-3 flex items-start gap-3">
                <span className={`mt-1.5 size-2 rounded-full shrink-0 ${it.ok ? "bg-success" : "bg-destructive"}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-3 flex-wrap">
                    <div className="text-sm font-medium">{it.titulo}</div>
                    <div className="font-mono text-sm">{it.valor}</div>
                  </div>
                  <div className={`text-xs mt-0.5 ${it.ok ? "text-muted-foreground" : "text-destructive"}`}>
                    {it.ok ? "Conforme " : "Não conforme — "}{it.norma}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

// ===================== ORÇAMENTO =====================
function OrcamentoView({
  ivaPct,
  contPct,
  projectName,
  projectId,
  boq,
  priceOverrides,
}: {
  ivaPct: number;
  contPct: number;
  projectName: string;
  projectId: string;
  boq: BoQSource;
  priceOverrides: Record<string, PriceOverride>;
}) {
  const subtotalGeral = boqGrandTotal(boq);
  const contingencia = subtotalGeral * contPct;
  const iva = subtotalGeral * ivaPct;
  const total = subtotalGeral + contingencia + iva;
  const groups = useProjectElementGroups(projectId);
  const detailed = useMemo(() => buildDetailedBoQ(groups, undefined, priceOverrides), [groups, priceOverrides]);
  const [mode, setMode] = useState<"fases" | "detalhado">(groups.length ? "detalhado" : "fases");
  // Banner de transparência do aço — dispensável por fase, só nesta sessão.
  const [steelDismissed, setSteelDismissed] = useState<Set<string>>(new Set());
  const dismissSteel = (k: string) => setSteelDismissed((s) => new Set(s).add(k));

  /** Guarda o preço editado no projecto e regista no Audit Log (imutável). */
  const savePrice = async (
    key: string,
    label: string,
    un: string,
    original: number,
    price: number,
    meta: { supplier: string; reason: string; note: string }
  ) => {
    const user = currentAuditUser();
    const at = new Date().toISOString();
    await setProjectPriceOverride(projectId, key, {
      price,
      original,
      by: user,
      at,
      reason: meta.reason,
      supplier: meta.supplier,
      note: meta.note || undefined,
    });
    const delta = original > 0 ? Math.round(((price - original) / original) * 100) : 0;
    pushAudit({
      dt: auditStamp(),
      user,
      item: `BoQ ${label}`,
      from: `${original.toLocaleString("pt-PT")} MT/${un}`,
      to: `${price.toLocaleString("pt-PT")} MT/${un}`,
      delta,
      just: `${meta.reason} · ${meta.supplier}${meta.note ? ` · ${meta.note}` : ""}`,
    });
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="text-sm text-muted-foreground max-w-xl">{boq.originLabel}</div>
        <div className="flex gap-2">
          <div className="inline-flex rounded-md border border-border overflow-hidden text-sm">
            {(["detalhado", "fases"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                disabled={m === "detalhado" && groups.length === 0}
                className={`px-3 py-1.5 transition disabled:opacity-40 ${
                  mode === m ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                }`}
              >
                {m === "detalhado" ? "BoQ detalhado" : "Resumo por fase"}
              </button>
            ))}
          </div>
          <button onClick={() => exportBoQExcel(projectName, boq, detailed)} className="inline-flex items-center gap-2 border border-border px-3 py-1.5 rounded-md text-sm hover:bg-muted">
            <FileSpreadsheet className="size-4" /> Excel
          </button>
          <button onClick={() => exportBoQPDF(projectName, boq, detailed)} className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-3 py-1.5 rounded-md text-sm font-medium hover:opacity-90">
            <Download className="size-4" /> PDF
          </button>
        </div>
      </div>

      {mode === "detalhado" && groups.length === 0 && (
        <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          Carregue um modelo IFC na Vista 3D para obter o BoQ detalhado por elemento.
        </div>
      )}

      {mode === "detalhado" && detailed.map((sec) => (
        <DetailedPhaseTable
          key={sec.phase}
          sec={sec}
          priceOverrides={priceOverrides}
          onSave={(key, label, un, original, price, meta) => savePrice(key, label, un, original, price, meta)}
        />
      ))}

      {mode === "fases" && boq.order.map((key) => {

        const sec = boq.sections[key];
        return (
          <div key={key} className="rounded-xl bg-surface-elevated border border-border shadow-soft overflow-hidden">
            <div className="px-5 py-3 border-b border-border bg-muted/30 flex items-center justify-between gap-3 flex-wrap">
              <div>
                <div className="font-display text-base">{sec.label}</div>
                <div className="text-[11px] text-muted-foreground">
                  {boq.hasReal
                    ? `${sec.volumeM3.toFixed(2)} m³ · ${sec.areaM2.toFixed(1)} m² · ${sec.elements} elementos`
                    : sec.desc}
                </div>
              </div>
              <div className="font-mono text-sm">{fmtMT(sec.total)}</div>
            </div>
            {!boq.rebar && sec.lines.some((l) => l.isSteel) && !steelDismissed.has(key) && (
              <div className="flex items-start gap-3 px-5 py-3 bg-warning/10 border-b border-warning/30">
                <AlertTriangle className="size-4 text-warning shrink-0 mt-0.5" />
                <p className="flex-1 text-xs leading-relaxed text-muted-foreground">
                  <span className="font-medium text-foreground">Aço A500 estimado por rácio kg/m³ de betão</span> — ficheiro
                  IFC não contém armadura modelada (IfcReinforcingBar). Para extracção exacta, carregue um modelo
                  estrutural com armaduras definidas.
                </p>
                <button
                  onClick={() => dismissSteel(key)}
                  className="shrink-0 text-[11px] font-medium text-muted-foreground border border-border rounded px-2 py-1 hover:bg-muted"
                >
                  Dispensar
                </button>
              </div>
            )}
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-muted-foreground text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-2.5 text-left">Item</th>
                  <th className="px-4 py-2.5 text-left">Descrição</th>
                  <th className="px-4 py-2.5 text-right">Un</th>
                  <th className="px-4 py-2.5 text-right">Qtd</th>
                  <th className="px-4 py-2.5 text-right">P.U.</th>
                  <th className="px-4 py-2.5 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sec.lines.map((l) => (
                  <tr key={l.item} className="hover:bg-muted/30 group">
                    <td className="px-4 py-2.5 font-mono">{l.item}</td>
                    <td className="px-4 py-2.5">{l.desc}</td>
                    <td className="px-4 py-2.5 text-right text-muted-foreground">{l.un}</td>
                    <td className="px-4 py-2.5 text-right font-mono">
                      {l.qty.toLocaleString("pt-PT", { maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono">
                      <PriceCell
                        lineKey={boqLineKey(key, l.item)}
                        label={`${l.item} — ${l.desc}`}
                        un={l.un}
                        preco={l.preco}
                        priced={l.priced}
                        edited={l.edited}
                        materialId={l.materialId}
                        onSave={(price, meta) =>
                          savePrice(boqLineKey(key, l.item), `${l.item} — ${l.desc}`, l.un, l.edited?.original ?? l.preco, price, meta)
                        }
                      />
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono font-medium">
                      {Math.round(l.qty * l.preco).toLocaleString("pt-PT")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}
      <div className="rounded-xl bg-primary text-primary-foreground p-6 shadow-elegant">
        <div className="text-[11px] uppercase tracking-[0.18em] text-white/60">Total geral do projecto</div>
        <div className="grid sm:grid-cols-4 gap-4 mt-4">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-white/60">Subtotal</div>
            <div className="font-display text-lg">{fmtMT(subtotalGeral)}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-white/60">Contingência {(contPct * 100).toFixed(0)}%</div>
            <div className="font-display text-lg">{fmtMT(contingencia)}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-white/60">IVA {(ivaPct * 100).toFixed(0)}%</div>
            <div className="font-display text-lg">{fmtMT(iva)}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-white/60">Total</div>
            <div className="font-display text-2xl text-accent">{fmtMT(total)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Drawer "Ver fornecedores": lista as cotações da Base de Preços para o
 * material da linha (por materialId ou fuzzy match por nome), com desvio da
 * mediana e botão para adoptar o preço — abre depois o modal de justificação
 * já com o fornecedor pré-preenchido.
 */
function SuppliersDrawer({
  label,
  un,
  materialId,
  onPick,
  onClose,
}: {
  label: string;
  un: string;
  materialId: string | null;
  onPick: (price: number, supplierName: string) => void;
  onClose: () => void;
}) {
  const byId = materialId ? materials.find((m) => m.id === materialId) : undefined;
  const material = byId ?? findMaterialFuzzy(label);
  const stats = material ? getStats(material.id) : null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <aside className="absolute right-0 top-0 h-full w-full max-w-lg bg-surface-elevated border-l border-border shadow-elegant flex flex-col animate-fade-in">
        <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-border">
          <div>
            <div className="font-display text-lg flex items-center gap-2">
              <Store className="size-4 text-accent" /> Fornecedores
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
            {material && (
              <div className="text-[11px] text-muted-foreground mt-0.5">
                Material na base: <span className="text-foreground">{material.name}</span>
              </div>
            )}
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="size-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {!stats || stats.byQuote.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              Material não encontrado na base de preços. Insira o preço manualmente.
            </div>
          ) : (
            <>
              <div className="rounded-lg bg-muted/40 border border-border px-3 py-2 text-xs text-muted-foreground mb-3">
                Mediana de referência:{" "}
                <span className="font-mono font-medium text-foreground">
                  {Math.round(stats.median).toLocaleString("pt-PT")} MT/{un}
                </span>
              </div>
              <table className="w-full text-sm">
                <thead className="text-muted-foreground text-[11px] uppercase tracking-wider">
                  <tr>
                    <th className="pb-2 text-left">Fornecedor</th>
                    <th className="pb-2 text-right">Preço (MT)</th>
                    <th className="pb-2 text-right">Desvio</th>
                    <th className="pb-2 text-left pl-3">Status</th>
                    <th className="pb-2" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {/* Linha da mediana destacada como referência */}
                  <tr className="font-medium bg-muted/30">
                    <td className="py-2 pr-2 text-muted-foreground italic">Mediana de mercado</td>
                    <td className="py-2 text-right font-mono">{Math.round(stats.median).toLocaleString("pt-PT")}</td>
                    <td className="py-2 text-right font-mono text-muted-foreground">0%</td>
                    <td className="py-2 pl-3 text-[11px] text-muted-foreground">referência</td>
                    <td />
                  </tr>
                  {[...stats.byQuote]
                    .sort((a, b) => a.quote.price - b.quote.price)
                    .map(({ quote, supplier, deviationPct, risk }) => (
                      <tr key={supplier.id} className="hover:bg-muted/20">
                        <td className="py-2 pr-2">
                          <div className="leading-tight">
                            <div>{supplier.name}</div>
                            <div className="text-[10px] text-muted-foreground">{supplier.location}</div>
                          </div>
                        </td>
                        <td className="py-2 text-right font-mono">
                          {quote.price.toLocaleString("pt-PT")}
                        </td>
                        <td
                          className={`py-2 text-right font-mono text-xs ${
                            deviationPct > 0 ? "text-warning" : "text-success"
                          }`}
                        >
                          {deviationPct > 0 ? "+" : ""}
                          {deviationPct.toFixed(1)}%
                        </td>
                        <td className="py-2 pl-3">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${RISK_COLOR[risk]}`}>
                            {RISK_LABEL[risk]}
                          </span>
                        </td>
                        <td className="py-2 text-right">
                          <button
                            onClick={() => onPick(quote.price, supplier.name)}
                            className="text-[11px] font-medium text-accent border border-accent/50 rounded px-2 py-1 hover:bg-accent/10 whitespace-nowrap"
                          >
                            Usar este preço
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </>
          )}
        </div>
      </aside>
    </div>
  );
}

const REASONS = [
  "Fornecedor específico exigido",
  "Actualização de cotação de mercado",
  "Preço negociado com fornecedor",
  "Condições logísticas do local",
  "Outro",
] as const;

type PriceMeta = { supplier: string; reason: string; note: string };

/**
 * Célula de P.U. editável: lápis no hover → edição inline → modal de justificação
 * (fornecedor + motivo + observações). Desvios >15% da mediana ficam marcados.
 */
function PriceCell({
  label,
  un,
  preco,
  priced,
  edited,
  materialId,
  onSave,
}: {
  lineKey?: string;
  label: string;
  un: string;
  preco: number;
  priced: boolean;
  edited?: PriceOverride;
  /** Ligação directa à Base de Preços; sem ela usa-se fuzzy match por nome. */
  materialId?: string | null;
  onSave: (price: number, meta: PriceMeta) => Promise<void> | void;
}) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState("");
  const [newPrice, setNewPrice] = useState<number | null>(null);
  const [supplier, setSupplier] = useState("");
  const [reason, setReason] = useState<string>(REASONS[0]);
  const [note, setNote] = useState("");
  const [showSup, setShowSup] = useState(false);
  const original = edited?.original ?? preco;
  const deviation = newPrice !== null && original > 0 ? ((newPrice - original) / original) * 100 : 0;

  const confirm = () => {
    const n = Number(val.replace(",", "."));
    if (!Number.isFinite(n) || n <= 0) return;
    setNewPrice(n);
  };
  const commit = async () => {
    if (newPrice === null) return;
    await onSave(newPrice, { supplier: supplier || "n/d", reason, note });
    setEditing(false);
    setNewPrice(null);
    setVal("");
    setSupplier("");
    setNote("");
  };
  const close = () => {
    setEditing(false);
    setNewPrice(null);
    setVal("");
  };

  return (
    <>
      <div className="inline-flex items-center justify-end gap-1.5 w-full">
        {edited && (
          <span
            className="size-1.5 rounded-full bg-accent shrink-0"
            title={`Preço editado por ${edited.by} em ${new Date(edited.at).toLocaleString("pt-PT")} — mediana ${edited.original.toLocaleString("pt-PT")} MT/${un} (${edited.reason} · ${edited.supplier})`}
          />
        )}
        {editing ? (
          <>
            <input
              autoFocus
              value={val}
              onChange={(e) => setVal(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") confirm();
                if (e.key === "Escape") close();
              }}
              placeholder={String(Math.round(original))}
              className="w-24 rounded border border-accent bg-background px-2 py-1 text-right font-mono text-xs focus:outline-none"
            />
            <button onClick={confirm} aria-label="Confirmar preço" className="text-accent hover:opacity-80">
              <Check className="size-3.5" />
            </button>
            <button onClick={close} aria-label="Cancelar edição" className="text-muted-foreground hover:text-foreground">
              <X className="size-3.5" />
            </button>
          </>
        ) : (
          <>
            <span className={edited ? "text-accent font-medium" : ""}>
              {priced || edited ? preco.toLocaleString("pt-PT") : <span className="text-warning">sem preço</span>}
            </span>
            <button
              onClick={() => {
                setEditing(true);
                setVal(String(Math.round(preco)));
              }}
              aria-label={`Editar preço de ${label}`}
              className="opacity-0 group-hover:opacity-100 focus:opacity-100 text-muted-foreground hover:text-accent transition"
            >
              <Pencil className="size-3" />
            </button>
            <button
              onClick={() => setShowSup(true)}
              aria-label={`Ver fornecedores de ${label}`}
              title="Ver fornecedores na Base de Preços"
              className="opacity-0 group-hover:opacity-100 focus:opacity-100 text-muted-foreground hover:text-accent transition"
            >
              <Store className="size-3" />
            </button>
          </>
        )}
      </div>

      {/* Drawer de comparação de fornecedores */}
      {showSup && (
        <SuppliersDrawer
          label={label}
          un={un}
          materialId={materialId ?? null}
          onPick={(price, supplierName) => {
            setNewPrice(price);
            setSupplier(supplierName);
            setReason(REASONS[2]); // "Preço negociado com fornecedor"
            setEditing(false);
            setShowSup(false);
          }}
          onClose={() => setShowSup(false)}
        />
      )}

      {newPrice !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setNewPrice(null)} />
          <div className="relative w-full max-w-md rounded-2xl bg-surface-elevated border border-border p-5 shadow-elegant">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-display text-lg">Justificar alteração de preço</div>
                <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
              </div>
              <button onClick={() => setNewPrice(null)} className="text-muted-foreground hover:text-foreground">
                <X className="size-4" />
              </button>
            </div>

            <div className="mt-4 rounded-lg border border-border bg-muted/30 px-3 py-2 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Original: <span className="font-mono">{original.toLocaleString("pt-PT")} MT/{un}</span></span>
              <span className="text-muted-foreground">→</span>
              <span className="text-foreground">Novo: <span className="font-mono font-medium text-accent">{newPrice.toLocaleString("pt-PT")} MT/{un}</span></span>
            </div>
            {Math.abs(deviation) > 15 && (
              <div className="mt-3 flex items-start gap-2 rounded-lg border border-warning/40 bg-warning/10 px-3 py-2">
                <AlertTriangle className="size-4 text-warning shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground">
                  Desvio de {deviation > 0 ? "+" : ""}{deviation.toFixed(1)}% face à mediana de mercado — classificado como
                  <span className="font-medium text-warning"> Atenção</span> na análise de risco.
                </p>
              </div>
            )}

            <div className="mt-4 space-y-3">
              <label className="block">
                <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Fornecedor</span>
                <input
                  value={supplier}
                  onChange={(e) => setSupplier(e.target.value)}
                  placeholder="ex.: SteelMais Lda, mercado informal…"
                  className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-accent focus:outline-none"
                />
              </label>
              <label className="block">
                <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Motivo</span>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-accent focus:outline-none"
                >
                  {REASONS.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Observações</span>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={2}
                  placeholder="Contexto, prazo de entrega, condições de pagamento…"
                  className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-accent focus:outline-none resize-none"
                />
              </label>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setNewPrice(null)}
                className="rounded-md border border-border px-4 py-2 text-sm text-muted-foreground hover:bg-muted"
              >
                Voltar
              </button>
              <button
                onClick={() => void commit()}
                className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:opacity-90"
              >
                Guardar e registar no Audit Log
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/** Tabela do BoQ detalhado: artigo por tipo/dimensão + materiais derivados. */
function DetailedPhaseTable({
  sec,
  priceOverrides,
  onSave,
}: {
  sec: DetailedPhase;
  priceOverrides: Record<string, PriceOverride>;
  onSave: (key: string, label: string, un: string, original: number, price: number, meta: PriceMeta) => Promise<void>;
}) {
  const [open, setOpen] = useState<string | null>(null);
  return (
    <div className="rounded-xl bg-surface-elevated border border-border shadow-soft overflow-hidden">
      <div className="px-5 py-3 border-b border-border bg-muted/30 flex items-center justify-between gap-3 flex-wrap">
        <div>
          <div className="font-display text-base">{sec.label}</div>
          <div className="text-[11px] text-muted-foreground">
            {sec.count} elementos · {sec.volumeM3.toFixed(2)} m³ · {sec.areaM2.toFixed(1)} m²
          </div>
        </div>
        <div className="font-mono text-sm">{fmtMT(sec.total)}</div>
      </div>
      <table className="w-full text-sm">
        <thead className="bg-muted/40 text-muted-foreground text-xs uppercase tracking-wider">
          <tr>
            <th className="px-4 py-2.5 text-left">Art.</th>
            <th className="px-4 py-2.5 text-left">Designação (extraída do modelo)</th>
            <th className="px-4 py-2.5 text-left">Secção / esp.</th>
            <th className="px-4 py-2.5 text-right">Altura</th>
            <th className="px-4 py-2.5 text-right">Nº</th>
            <th className="px-4 py-2.5 text-right">Un</th>
            <th className="px-4 py-2.5 text-right">Qtd</th>
            <th className="px-4 py-2.5 text-right">Total</th>
          </tr>

        </thead>
        <tbody className="divide-y divide-border">
          {sec.lines.map((l) => (
            <Fragment key={l.code}>
              <tr
                onClick={() => setOpen(open === l.code ? null : l.code)}
                className="hover:bg-muted/30 cursor-pointer"
              >
                <td className="px-4 py-2.5 font-mono">{l.code}</td>
                <td className="px-4 py-2.5">
                  <div>{l.desc}</div>
                  {l.note && <div className="text-[11px] text-muted-foreground">{l.note}</div>}
                </td>
                <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">
                  {l.dims.section ?? (l.dims.thicknessM ? `esp. ${l.dims.thicknessM.toFixed(2).replace(".", ",")} m` : "—")}
                </td>
                <td className="px-4 py-2.5 text-right font-mono text-xs text-muted-foreground">
                  {l.dims.heightM ? `${l.dims.heightM.toFixed(2).replace(".", ",")} m` : "—"}
                </td>
                <td className="px-4 py-2.5 text-right font-mono">{l.count}</td>
                <td className="px-4 py-2.5 text-right text-muted-foreground">{l.un}</td>
                <td className="px-4 py-2.5 text-right font-mono">
                  {l.qty.toLocaleString("pt-PT", { maximumFractionDigits: 2 })}
                </td>
                <td className="px-4 py-2.5 text-right font-mono font-medium">
                  {Math.round(l.total).toLocaleString("pt-PT")}
                </td>
              </tr>
              {open === l.code && (
                <tr className="bg-muted/20">
                  <td />
                  <td colSpan={7} className="px-4 py-3">

                    <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">
                      Materiais a preço de mercado local
                    </div>
                    <table className="w-full text-xs">
                      <tbody className="divide-y divide-border/60">
                        {l.materials.map((m) => (
                          <tr key={m.item} className="group">
                            <td className="py-1.5">{m.desc}</td>
                            <td className="py-1.5 text-right text-muted-foreground">{m.un}</td>
                            <td className="py-1.5 text-right font-mono">
                              {m.qty.toLocaleString("pt-PT", { maximumFractionDigits: 2 })}
                            </td>
                            <td className="py-1.5 text-right font-mono">
                              <PriceCell
                                label={`${l.code} · ${m.desc}`}
                                un={m.un}
                                preco={m.preco}
                                priced={m.priced}
                                edited={priceOverrides[boqDetailMatKey(l.code, m.item)]}
                                onSave={(price, meta) => {
                                  const key = boqDetailMatKey(l.code, m.item);
                                  return onSave(key, `${l.code} · ${m.desc}`, m.un, priceOverrides[key]?.original ?? m.preco, price, meta);
                                }}
                              />
                            </td>
                            <td className="py-1.5 text-right font-mono font-medium">
                              {Math.round(m.qty * m.preco).toLocaleString("pt-PT")}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </td>
                </tr>
              )}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ===================== CRONOGRAMA =====================
/**
 * Duas dimensões separadas e comparáveis:
 *  - Planeado: Gantt por tarefa/fase ao longo das semanas (janela + tempo decorrido).
 *  - Real: unidades confirmadas nos relatórios diários / quantidade-alvo.
 */
function CronogramaView({ project }: { project: ProjectRecord }) {
  return <Cronograma project={project} />;
}


// ===================== AUDIT LOG =====================
function AuditLogView() {
  const entries = useAudit();
  return (
    <div className="rounded-xl bg-surface-elevated border border-border shadow-soft overflow-hidden">
      <div className="px-5 py-3 border-b border-border flex items-center gap-2">
        <ScrollText className="size-4 text-accent" />
        <span className="text-sm">Acções registadas na sua conta · {entries.length} entradas</span>
      </div>
      {entries.length === 0 ? (
        <div className="p-10 text-center text-sm text-muted-foreground">
          Sem dados — ainda não há acções registadas nesta conta.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/60 text-muted-foreground text-xs uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3 text-left">Data / Hora</th>
                <th className="px-4 py-3 text-left">Utilizador</th>
                <th className="px-4 py-3 text-left">Item</th>
                <th className="px-4 py-3 text-left">Anterior</th>
                <th className="px-4 py-3 text-left">Novo</th>
                <th className="px-4 py-3">Δ%</th>
                <th className="px-4 py-3 text-left">Justificativa</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {entries.map((e, i) => (
                <tr key={i} className="hover:bg-muted/30">
                  <td className="px-4 py-3 font-mono text-xs whitespace-nowrap">{e.dt}</td>
                  <td className="px-4 py-3">{e.user}</td>
                  <td className="px-4 py-3 font-medium">{e.item}</td>
                  <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{e.from}</td>
                  <td className="px-4 py-3 font-mono text-xs">{e.to}</td>
                  <td className={`px-4 py-3 text-center font-mono ${e.delta > 10 ? "text-destructive font-medium" : "text-muted-foreground"}`}>
                    {e.delta > 0 ? `+${e.delta}%` : "—"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground max-w-sm">{e.just}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ===================== RELATÓRIO =====================
function RelatorioView({
  project,
  boq,
  total,
  ivaPct,
  contPct,
}: {
  project: ProjectRecord;
  boq: BoQSource;
  total: number;
  ivaPct: number;
  contPct: number;
}) {
  const entries = useAudit();
  const phases = project.phases?.length ? project.phases : [];
  const avg = phases.length ? Math.round(phases.reduce((a, f) => a + f.pct, 0) / phases.length) : null;
  const geral = total * (1 + ivaPct + contPct);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <FileText className="size-4" />
          Relatório gerado exclusivamente a partir dos dados reais deste projecto
        </div>
        <button onClick={() => exportBoQPDF(project.name, boq)} className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:opacity-90">
          <Download className="size-4" /> Gerar PDF
        </button>
      </div>
      <div className="rounded-xl bg-surface-elevated border border-border shadow-soft p-8 max-w-3xl mx-auto">
        <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">SQI — Relatório de obra</div>
        <h2 className="font-display text-2xl mt-1">{project.name}</h2>
        <div className="text-sm text-muted-foreground">{project.location} · {project.client}</div>

        <div className="grid sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-border">
          <Metric label="Subtotal do orçamento" value={fmtMT(total)} />
          <Metric label={`Total c/ contingência ${(contPct * 100).toFixed(0)}% e IVA ${(ivaPct * 100).toFixed(0)}%`} value={fmtMT(geral)} />
          <Metric label="Progresso médio declarado" value={avg === null ? "sem dados" : `${avg}%`} />
        </div>

        <div className="mt-6 pt-6 border-t border-border">
          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Origem dos números</div>
          <p className="text-sm leading-relaxed text-muted-foreground">{boq.originLabel}</p>
        </div>

        <div className="mt-6 pt-6 border-t border-border">
          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Custo por fase</div>
          <table className="w-full text-sm">
            <tbody className="divide-y divide-border">
              {boq.order.map((p) => {
                const sec = boq.sections[p];
                return (
                  <tr key={p}>
                    <td className="py-2">{sec.label}</td>
                    <td className="py-2 text-right text-xs text-muted-foreground font-mono">
                      {boq.hasReal ? `${sec.volumeM3.toFixed(2)} m³ · ${sec.elements} el.` : "sem modelo"}
                    </td>
                    <td className="py-2 text-right font-mono">{fmtMT(sec.total)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-6 pt-6 border-t border-border">
          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Armadura</div>
          <p className="text-sm leading-relaxed">
            {boq.rebar
              ? `Extraída do modelo IFC: ${boq.rebar.totalBars.toLocaleString("pt-PT")} varões, ${boq.rebar.totalLengthM.toFixed(0)} m, ${boq.rebar.totalMassKg.toFixed(0)} kg (${boq.rebar.byDiameter
                  .map((r) => `Ø${r.diameterMm}: ${r.bars}`)
                  .join(" · ")}).`
              : "Sem armadura modelada no ficheiro — quantidades de aço estimadas por rácio kg/m³ por fase."}
          </p>
        </div>

        <div className="mt-6 pt-6 border-t border-border">
          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Registo de alterações</div>
          <p className="text-sm text-muted-foreground">
            {entries.length === 0 ? "Sem dados — nenhuma alteração registada nesta conta." : `${entries.length} acções registadas (ver separador Audit Log).`}
          </p>
        </div>

        <div className="mt-6 pt-6 border-t border-border text-[11px] text-muted-foreground text-right">
          Gerado por SQI · {new Date().toLocaleDateString("pt-PT")}
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value, accent = false }: any) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`font-display text-xl mt-1 ${accent ? "text-destructive" : ""}`}>{value}</div>
    </div>
  );
}
