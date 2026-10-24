import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ rpc: vi.fn(), single: vi.fn() }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: {
  rpc: mocks.rpc,
  from: () => ({ delete: () => ({ eq: () => ({ select: () => ({ single: mocks.single }) }) }) }),
} }));
import { deleteProject, saveManualLine } from "./projects";
describe("project audit protection", () => {
  beforeEach(() => vi.clearAllMocks());
  it("rejects a nine-character justification before submitting a manual action", async () => {
    expect(await saveManualLine("id", { id: "line", phase: "pilares", description: "Pilar", unit: "un", quantity: 1, materialId: null }, "123456789")).toContain("10 caracteres");
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
  it("returns an archive instruction when the database refuses deletion of an audited project", async () => {
    mocks.single.mockResolvedValue({ error: { code: "23503", message: "foreign key violation" } });
    expect(await deleteProject("audited-project")).toBe("Este projecto tem registos associados e não pode ser apagado. Arquive-o.");
  });
});