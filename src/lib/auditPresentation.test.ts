import { describe, expect, it } from "vitest";
import { presentAuditEntry, presentIntegrityMessage, projectMetadata } from "./auditPresentation";

const base = { dt: "", user: "", item: "", just: "", delta: 0 };
const line = (quantity: number) => JSON.stringify({ id: "1", phase: "fundacao", description: "Betão", unit: "m³", quantity, materialId: null });

describe("audit presentation", () => {
  it("shows a new manual line without JSON", () => {
    expect(presentAuditEntry({ ...base, from: "—", to: line(2) }).to).toBe("Betão · 2 m³ · fase Fundação");
  });
  it("shows only the changed quantity and its percentage", () => {
    expect(presentAuditEntry({ ...base, from: line(2), to: line(3) })).toMatchObject({ from: "2 m³", to: "3 m³", deltaLabel: "+50%" });
  });
  it("uses correct integrity grammar", () => {
    expect(presentIntegrityMessage("íntegro (1 entrada verificadas)")).toBe("íntegra (1 entrada verificada)");
  });
  it("hides empty project metadata", () => {
    expect(projectMetadata("", "—")).toBe("");
  });
});