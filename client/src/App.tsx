import { Switch, Route, useLocation, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth";
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
import Login from "@/pages/login";
import Pricing from "@/pages/pricing";
import AdminTeam from "@/pages/admin-team";
import Billing from "@/pages/billing";
import SubscriptionSuccess from "@/pages/subscription-success";
import SubmitRequest from "@/pages/submit-request";
import AdminRequests from "@/pages/admin-requests";
import SettingsPage from "@/pages/settings";
import SupplementsPage from "@/pages/supplements";
import CaseStudiesPage from "@/pages/case-studies";
import RiskAlertsPage from "@/pages/risk-alerts";
import { Loader2 } from "lucide-react";

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { authenticated, loading, needsSubscription, userType } = useAuth();
  const [, setLocation] = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    );
  }

  if (!authenticated) {
    return <Redirect to="/login" />;
  }

  if (userType === 'individual' && needsSubscription) {
    return <Redirect to="/pricing" />;
  }

  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/pricing" component={Pricing} />
      <Route path="/subscription/success" component={SubscriptionSuccess} />
      <Route path="/billing">
        <ProtectedRoute component={Billing} />
      </Route>
      <Route path="/">
        <ProtectedRoute component={Home} />
      </Route>
      <Route path="/chat">
        <ProtectedRoute component={Chat} />
      </Route>
      <Route path="/claims">
        <ProtectedRoute component={Claims} />
      </Route>
      <Route path="/claims/:id">
        <ProtectedRoute component={ClaimDetail} />
      </Route>
      <Route path="/carriers">
        <ProtectedRoute component={Carriers} />
      </Route>
      <Route path="/carriers/:name">
        <ProtectedRoute component={CarrierDetail} />
      </Route>
      <Route path="/adjuster/:id">
        <ProtectedRoute component={AdjusterProfile} />
      </Route>
      <Route path="/tactical-advisor">
        <ProtectedRoute component={TacticalAdvisor} />
      </Route>
      <Route path="/analytics">
        <ProtectedRoute component={Analytics} />
      </Route>
      <Route path="/reports">
        <ProtectedRoute component={Reports} />
      </Route>
      <Route path="/admin/team">
        <ProtectedRoute component={AdminTeam} />
      </Route>
      <Route path="/admin/requests">
        <ProtectedRoute component={AdminRequests} />
      </Route>
      <Route path="/settings">
        <ProtectedRoute component={SettingsPage} />
      </Route>
      <Route path="/supplements">
        <ProtectedRoute component={SupplementsPage} />
      </Route>
      <Route path="/case-studies">
        <ProtectedRoute component={CaseStudiesPage} />
      </Route>
      <Route path="/risk-alerts">
        <ProtectedRoute component={RiskAlertsPage} />
      </Route>
      <Route path="/submit-request" component={SubmitRequest} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
