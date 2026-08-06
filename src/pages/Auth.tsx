import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { Building2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export default function Auth() {
  const { session, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const from = (location.state as { from?: string } | null)?.from ?? "/app";

  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  if (!loading && session) return <Navigate to={from} replace />;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setBusy(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin + "/app" },
        });
        if (error) throw error;
        if (!data.session) {
          setNotice("Conta criada. Verifique o email para confirmar antes de entrar.");
          return;
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err?.message ?? "Não foi possível autenticar.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-surface-sunken">
      <div className="hidden lg:flex flex-col justify-between bg-primary text-primary-foreground p-12">
        <Link to="/" className="flex items-center gap-3">
          <div className="size-10 rounded-md bg-gradient-accent grid place-items-center shadow-soft">
            <Building2 className="size-5" />
          </div>
          <div>
            <div className="font-display text-xl leading-none">SQI</div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-white/60 mt-1">
              Sistema Quantitativo Integrado
            </div>
          </div>
        </Link>
        <div className="max-w-md">
          <h2 className="font-display text-4xl leading-tight">
            Quantidades, preços e auditoria — na mesma conta.
          </h2>
          <p className="text-white/70 mt-4 text-sm leading-relaxed">
            Os seus projectos, modelos BIM e orçamentos ficam guardados na nuvem e
            visíveis apenas para si, em qualquer dispositivo.
          </p>
        </div>
        <div className="text-[11px] text-white/50 uppercase tracking-[0.18em]">
          Maputo · Beira · Lichinga
        </div>
      </div>

      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <h1 className="font-display text-3xl">
            {mode === "login" ? "Entrar na plataforma" : "Criar conta"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Acesso à gestão de projectos, BoQ e Base de Preços.
          </p>

          <form onSubmit={submit} className="mt-8 space-y-4">
            <div>
              <label className="text-xs uppercase tracking-wider text-muted-foreground">Email</label>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1.5 w-full px-3 py-2 rounded-md border border-border bg-background text-sm focus:outline-none focus:border-accent"
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wider text-muted-foreground">Palavra-passe</label>
              <input
                type="password"
                required
                minLength={6}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1.5 w-full px-3 py-2 rounded-md border border-border bg-background text-sm focus:outline-none focus:border-accent"
              />
            </div>
            {error && <div className="text-xs text-destructive">{error}</div>}
            {notice && <div className="text-xs text-accent">{notice}</div>}
            <button
              type="submit"
              disabled={busy}
              className="w-full inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-md text-sm font-medium hover:opacity-90 disabled:opacity-60"
            >
              {busy && <Loader2 className="size-4 animate-spin" />}
              {mode === "login" ? "Entrar" : "Criar conta"}
            </button>
          </form>

          <button
            onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(null); setNotice(null); }}
            className="mt-5 text-sm text-accent hover:underline"
          >
            {mode === "login" ? "Não tenho conta — registar" : "Já tenho conta — entrar"}
          </button>

          <div className="mt-8 text-xs text-muted-foreground">
            <Link to="/" className="hover:underline">← Voltar à página inicial</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
