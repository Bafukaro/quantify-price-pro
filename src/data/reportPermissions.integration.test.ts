import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

// Run against a dedicated demonstration project, never a production report.
const enabled = Boolean(process.env.SQI_TEST_PROJECT_ID && process.env.LOVABLE_BROWSER_SUPABASE_SESSION_JSON);
describe.skipIf(!enabled)("Regras de relatórios na base", () => {
  let client: SupabaseClient;
  let owner = "";
  let pending = "";
  let confirmed = "";
  let rejected = "";
  const projectId = process.env.SQI_TEST_PROJECT_ID ?? "";
  const lineKey = process.env.SQI_TEST_LINE_KEY ?? "";
  const purchaseId = crypto.randomUUID();
  const newReport = async (purchases: unknown[] = []) => {
    const r = await client.from("daily_reports").insert({ owner_id:owner,project_id:projectId,qty:5,purchases }).select().single();
    if(r.error) throw r.error;
    return r.data.id as string;
  };
  const review = (id: string, status: string, justification: string) => client.rpc("review_report_purchases",{_id:id,_status:status,_approved_qty:5,_reason:"Verificação das regras de relatório.",_justifications:{[purchaseId]:justification}});
  beforeAll(async () => {
    const env=Object.fromEntries(readFileSync(".env","utf8").split("\n").filter(l=>l.startsWith("VITE_")).map(l=>{const i=l.indexOf("=");return [l.slice(0,i),l.slice(i+1).trim().replace(/^["']|["']$/g,"")];}));
    client=createClient(env.VITE_SUPABASE_URL,env.VITE_SUPABASE_PUBLISHABLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
    const session=JSON.parse(process.env.LOVABLE_BROWSER_SUPABASE_SESSION_JSON??"{}");
    const auth=await client.auth.setSession(session); if(auth.error)throw auth.error;
    owner=auth.data.user?.id??""; if(!owner)throw Error("Sem sessão");
    pending=await newReport();
    confirmed=await newReport([{id:purchaseId,lineKey,quantity:500,paidPrice:128,supplier:"Fornecedor de verificação",invoice:"TEST-30",receipt:""}]);
    rejected=await newReport();
  });
  it("novos relatórios não podem entrar Confirmados",async()=>{
    const r=await client.from("daily_reports").insert({owner_id:owner,project_id:projectId,qty:1,status:"confirmado"}); expect(r.error).not.toBeNull();
  });
  it("Pendentes não podem ser apagados",async()=>{
    const r=await client.from("daily_reports").delete().eq("id",pending); expect(r.error).not.toBeNull();
  });
  it("confirmação directa fora da função é recusada",async()=>{
    const r=await client.from("daily_reports").update({status:"confirmado"}).eq("id",pending); expect(r.error).not.toBeNull();
  });
  it("29 caracteres falham sem mudar estado nem acrescentar auditoria",async()=>{
    const before=await client.from("audit_log").select("id",{count:"exact"}).eq("project_id",projectId);
    const r=await review(confirmed,"confirmado","x".repeat(29)); expect(r.error).not.toBeNull();
    const state=await client.from("daily_reports").select("status,reconciliation").eq("id",confirmed).single();
    const after=await client.from("audit_log").select("id",{count:"exact"}).eq("project_id",projectId);
    expect(state.data?.status).toBe("pendente"); expect(state.data?.reconciliation).toEqual([]); expect(after.count).toBe(before.count);
  });
  it("30 caracteres confirmam e guardam diferença de 10 000 MT e flag",async()=>{
    const r=await review(confirmed,"confirmado","x".repeat(30)); expect(r.error).toBeNull();
    const state=await client.from("daily_reports").select("status,reconciliation,reviewed_by").eq("id",confirmed).single();
    expect(state.data?.status).toBe("confirmado"); expect(state.data?.reconciliation[0].difference).toBe(10000);expect(state.data?.reconciliation[0].mismatch).toBe(true);
    expect(state.data?.reviewed_by).toContain("mesma pessoa que submeteu; perfis ainda não activos");
  });
  it("Confirmados não podem ser editados nem apagados",async()=>{
    const update=await client.from("daily_reports").update({qty:999}).eq("id",confirmed); const del=await client.from("daily_reports").delete().eq("id",confirmed);
    expect(update.error).not.toBeNull();expect(del.error).not.toBeNull();
  });
  it("rejeição e auditoria são guardadas juntas",async()=>{
    const before=await client.from("audit_log").select("id",{count:"exact"}).eq("project_id",projectId);
    const r=await review(rejected,"rejeitado","");expect(r.error).toBeNull();
    const state=await client.from("daily_reports").select("status").eq("id",rejected).single();
    const after=await client.from("audit_log").select("id",{count:"exact"}).eq("project_id",projectId);
    expect(state.data?.status).toBe("rejeitado");expect(after.count).toBe((before.count??0)+1);
  });
  it("Rejeitados não podem ser editados nem apagados",async()=>{
    const update=await client.from("daily_reports").update({note:"correcção"}).eq("id",rejected); const del=await client.from("daily_reports").delete().eq("id",rejected);
    expect(update.error).not.toBeNull();expect(del.error).not.toBeNull();
  });
  it("comprovativo fora do projecto é recusado",async()=>{
    const r=await client.from("daily_reports").insert({owner_id:owner,project_id:projectId,qty:1,purchases:[{id:crypto.randomUUID(),lineKey,quantity:1,paidPrice:128,supplier:"Teste",invoice:"TEST",receipt:"outro/projecto/recibo.pdf"}]});
    expect(r.error).not.toBeNull();
  });
  afterAll(async()=>{
    if(client&&pending) await review(pending,"rejeitado","");
  });
});