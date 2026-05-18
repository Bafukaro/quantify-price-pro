import { ShieldCheck, AlertTriangle, CheckCircle2, XCircle, FileBadge, Beaker, Ruler, Scale } from "lucide-react";

type Status = "ok" | "warn" | "fail";

const KPIS = [
  { label: "Conformidade global", value: "87%", status: "ok" as Status, hint: "REBAP · EN 1992 · EN 206" },
  { label: "Alertas estruturais", value: "3", status: "warn" as Status, hint: "Revisão recomendada" },
  { label: "Não-conformidades", value: "1", status: "fail" as Status, hint: "Certificação em falta" },
  { label: "Normas verificadas", value: "12 / 14", status: "ok" as Status, hint: "REBAP / EC2 / EC3 / EN 206" },
];

const CHECKS = [
  {
    norm: "REBAP",
    title: "Taxa de armadura mínima — pilares P1.2",
    detail: "ρ = 0.6% abaixo do mínimo recomendado de 0.8% (REBAP Art. 90).",
    icon: Ruler,
    status: "warn" as Status,
  },
  {
    norm: "EN 206",
    title: "Especificação do betão C25/30 — lajes",
    detail: "Classe de exposição XC2 declarada; recomendado XC3 para ambiente húmido (Beira).",
    icon: Beaker,
    status: "warn" as Status,
  },
  {
    norm: "EN 1992",
    title: "Recobrimento mínimo das armaduras",
    detail: "Valor declarado 25 mm — em conformidade com cnom = 25 mm para XC1.",
    icon: CheckCircle2,
    status: "ok" as Status,
  },
  {
    norm: "ISO 9001",
    title: "Certificação do fornecedor de aço A500",
    detail: "Fornecedor Aços Maputo Lda sem certificação de conformidade actualizada (2023).",
    icon: FileBadge,
    status: "fail" as Status,
  },
  {
    norm: "EN 1993",
    title: "Verificação de perfis metálicos cobertura",
    detail: "Perfis IPE 200 dentro dos limites de esbelteza λ ≤ 180.",
    icon: Scale,
    status: "ok" as Status,
  },
];

const tone = (s: Status) =>
  s === "ok"
    ? "border-success/30 bg-success/5 text-success"
    : s === "warn"
    ? "border-warning/40 bg-warning/10 text-warning"
    : "border-destructive/40 bg-destructive/10 text-destructive";

export default function Compliance() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="rounded-xl border border-border bg-surface-elevated p-5 flex items-start gap-4">
        <div className="size-10 rounded-md bg-accent/10 grid place-items-center">
          <ShieldCheck className="size-5 text-accent" />
        </div>
        <div className="flex-1">
          <h2 className="font-display text-2xl">Compliance & Standards</h2>
          <p className="text-sm text-muted-foreground mt-1 max-w-3xl">
            Apoio à engenharia e verificação de conformidade técnica com REBAP, Eurocódigos (EC2 / EC3),
            EN 206 e certificações de fornecedores. <span className="text-foreground font-medium">Não substitui o cálculo do engenheiro</span> —
            assinala desvios e suporta a decisão técnica.
          </p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {KPIS.map((k) => (
          <div key={k.label} className={`p-5 rounded-xl border ${tone(k.status)} bg-surface-elevated`}>
            <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">{k.label}</div>
            <div className="font-display text-3xl mt-2 text-foreground">{k.value}</div>
            <div className="text-xs text-muted-foreground mt-1">{k.hint}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-xl border border-border bg-surface-elevated">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <h3 className="font-display text-lg">Verificações técnicas</h3>
            <span className="text-xs text-muted-foreground">Atualizado há 2 min</span>
          </div>
          <ul className="divide-y divide-border">
            {CHECKS.map((c, i) => (
              <li key={i} className="px-5 py-4 flex items-start gap-4">
                <div className={`size-9 rounded-md grid place-items-center border ${tone(c.status)}`}>
                  <c.icon className="size-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                      {c.norm}
                    </span>
                    <span className="text-sm font-medium">{c.title}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{c.detail}</p>
                </div>
                <StatusPill status={c.status} />
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-5">
          <div className="rounded-xl border border-border bg-surface-elevated p-5">
            <div className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Cobertura normativa</div>
            {[
              { name: "REBAP", pct: 92 },
              { name: "EN 1992 (EC2)", pct: 88 },
              { name: "EN 1993 (EC3)", pct: 81 },
              { name: "EN 206 — Betão", pct: 95 },
              { name: "ISO 9001 fornecedores", pct: 64 },
            ].map((n) => (
              <div key={n.name} className="mb-3 last:mb-0">
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium">{n.name}</span>
                  <span className="font-mono text-muted-foreground">{n.pct}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full ${n.pct >= 85 ? "bg-success" : n.pct >= 70 ? "bg-warning" : "bg-destructive"}`}
                    style={{ width: `${n.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-border bg-primary text-primary-foreground p-5">
            <div className="text-xs uppercase tracking-[0.16em] text-white/60">Disclaimer técnico</div>
            <p className="text-sm mt-2 text-white/90">
              Os indicadores apresentados são <span className="font-semibold">apoio à decisão</span>.
              A validação final do projecto estrutural permanece da responsabilidade do engenheiro projectista.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: Status }) {
  const map = {
    ok: { Icon: CheckCircle2, label: "Conforme", cls: "text-success" },
    warn: { Icon: AlertTriangle, label: "Atenção", cls: "text-warning" },
    fail: { Icon: XCircle, label: "Não conforme", cls: "text-destructive" },
  } as const;
  const { Icon, label, cls } = map[status];
  return (
    <span className={`shrink-0 inline-flex items-center gap-1.5 text-xs font-medium ${cls}`}>
      <Icon className="size-4" /> {label}
    </span>
  );
}