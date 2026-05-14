import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Landing from "./pages/Landing.tsx";
import NotFound from "./pages/NotFound.tsx";
import AppLayout from "./components/layout/AppLayout.tsx";
import Dashboard from "./pages/app/Dashboard.tsx";
import Project from "./pages/app/Project.tsx";
import Prices from "./pages/app/Prices.tsx";
import Audit from "./pages/app/Audit.tsx";
import Schedule from "./pages/app/Schedule.tsx";
import Model3D from "./pages/app/Model3D.tsx";
import Risk from "./pages/app/Risk.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/app" element={<AppLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="projecto/:id" element={<Project />} />
            <Route path="modelo-3d" element={<Model3D />} />
            <Route path="precos" element={<Prices />} />
            <Route path="risco" element={<Risk />} />
            <Route path="auditoria" element={<Audit />} />
            <Route path="cronograma" element={<Schedule />} />
          </Route>
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
