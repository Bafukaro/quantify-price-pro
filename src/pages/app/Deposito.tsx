import { Link } from "react-router-dom";
import { Box, ScrollText, Search } from "lucide-react";
import { useProjects, useProjectsLoaded } from "@/data/store";
import { Button } from "@/components/ui/button";

export default function Deposito() {
  const allProjects = useProjects();
  const projects = allProjects.filter((p) => p.archived);
  const projectsLoaded = useProjectsLoaded();

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start gap-3">
        <div className="size-10 rounded-lg bg-accent/10 grid place-items-center shrink-0">
          <Box className="size-5 text-accent" />
        </div>
        <div>
          <h2 className="font-display text-2xl">Depósito</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Projectos guardados · histórico de auditoria preservado.
          </p>
        </div>
      </div>

      <div className="divide-y divide-border border-y border-border">
        {projectsLoaded && projects.length === 0 && (
          <div className="py-10 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
            <Search className="size-4" /> Nenhum projecto guardado.
          </div>
        )}
        {projects.map((p) => (
          <div key={p.id} className="flex items-center justify-between gap-3 py-4 flex-wrap">
            <div>
              <Link className="font-medium hover:text-accent" to={`/app/projecto/${p.id}`}>
                {p.name}
              </Link>
              <div className="text-xs text-muted-foreground mt-0.5">
                {p.client} · {p.location}
              </div>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link to={`/app/projecto/${p.id}?tab=auditlog`}>
                <ScrollText /> Audit Log
              </Link>
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
