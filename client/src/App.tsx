import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import AdjusterProfile from "@/pages/adjuster";
import Chat from "@/pages/chat";
import Claims from "@/pages/claims";
import ClaimDetail from "@/pages/claim";
import Carriers from "@/pages/carriers";
import CarrierDetail from "@/pages/carrier";
import TacticalAdvisor from "@/pages/tactical-advisor";
import Analytics from "@/pages/analytics";
import Reports from "@/pages/reports";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/chat" component={Chat} />
      <Route path="/claims" component={Claims} />
      <Route path="/claims/:id" component={ClaimDetail} />
      <Route path="/carriers" component={Carriers} />
      <Route path="/carriers/:name" component={CarrierDetail} />
      <Route path="/adjuster/:id" component={AdjusterProfile} />
      <Route path="/tactical-advisor" component={TacticalAdvisor} />
      <Route path="/analytics" component={Analytics} />
      <Route path="/reports" component={Reports} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
