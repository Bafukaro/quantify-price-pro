import type { AuditEntry } from "@/data/store";
import { PHASES, phaseLabel } from "@/lib/phaseQuantities";
import { materials } from "@/data/priceDb";

type ManualValue = { description: string; quantity: number; unit: string; phase: string; materialId?: string | null };
const number = (n: number) => new Intl.NumberFormat("pt-PT", { maximumFractionDigits: 2 }).format(n);
const phase = (value: string) => {
  const key = PHASES.find((p) => p === value);
  return key ? phaseLabel(key) : value;
};
function parse(value: string): unknown {
  try { return JSON.parse(value); } catch { return null; }
}
function manual(value: unknown): ManualValue | null {
  if (!value || typeof value !== "object") return null;
  const line = value as Partial<ManualValue>;
  return typeof line.description === "string" && typeof line.quantity === "number" && Number.isFinite(line.quantity)
    && typeof line.unit === "string" && typeof line.phase === "string" ? line as ManualValue : null;
}
const quantity = (line: ManualValue) => `${number(line.quantity)} ${line.unit}`;
const summary = (line: ManualValue) => `${line.description} · ${quantity(line)} · fase ${phase(line.phase)}`;
const material = (id?: string | null) => materials.find((m) => m.id === id)?.name ?? id ?? "sem material";

/** Display-only projection. Never mutate the stored entry or its server hash. */
export function presentAuditEntry(entry: AuditEntry) {
  const oldParsed = parse(entry.from);
  const newParsed = parse(entry.to);
  const before = manual(oldParsed);
  const after = manual(newParsed);
  let from = readableValue(entry.from, oldParsed);
  let to = readableValue(entry.to, newParsed);
  let delta: number | null = entry.delta !== 0 ? entry.delta : null;
  if (before && after) {
    const oldParts: string[] = [], newParts: string[] = [];
    if (before.description !== after.description) { oldParts.push(before.description); newParts.push(after.description); }
    if (before.quantity !== after.quantity || before.unit !== after.unit) { oldParts.push(quantity(before)); newParts.push(quantity(after)); }
    if (before.phase !== after.phase) { oldParts.push(`fase ${phase(before.phase)}`); newParts.push(`fase ${phase(after.phase)}`); }
    if (before.materialId !== after.materialId) { oldParts.push(`material ${material(before.materialId)}`); newParts.push(`material ${material(after.materialId)}`); }
    from = oldParts.join(" · ") || "Sem alteração";
    to = newParts.join(" · ") || "Sem alteração";
    delta = before.unit === after.unit && before.quantity !== 0 && before.quantity !== after.quantity
      ? (after.quantity - before.quantity) / before.quantity * 100 : null;
  } else if (before || after) {
    from = before ? summary(before) : from;
    to = after ? summary(after) : to;
    delta = null;
  }
  return { from, to, delta, deltaLabel: delta === null ? "—" : `${delta > 0 ? "+" : ""}${number(delta)}%` };
}

function readableValue(raw: string, parsed: unknown): string {
  const line = manual(parsed);
  if (line) return summary(line);
  if (parsed && typeof parsed === "object") {
    return Object.entries(parsed).filter(([key]) => key !== "id")
      .map(([key, value]) => `${key}: ${typeof value === "object" ? "valor composto" : String(value ?? "—")}`).join(" · ") || "—";
  }
  return raw || "—";
}

export const auditEntryCount = (count: number) => `${count} ${count === 1 ? "entrada" : "entradas"}`;
export const presentIntegrityMessage = (message: string) => message.replace(/íntegro/g, "íntegra")
  .replace(/(\d+) entradas?(?:\(s\))?(?: (verificadas?))?/g, (_, count: string, verified?: string) =>
    `${auditEntryCount(Number(count))}${verified ? (Number(count) === 1 ? " verificada" : " verificadas") : ""}`);
export const projectMetadata = (...values: (string | undefined | null)[]) => values
  .map((value) => value?.trim()).filter((value) => value && value !== "—" && value !== "-").join(" · ");