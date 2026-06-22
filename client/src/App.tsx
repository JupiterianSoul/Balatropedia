import { Switch, Route, Router } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppProvider } from "@/lib/appContext";
import { AuthProvider } from "@/lib/auth";
import { I18nProvider } from "@/lib/i18n";
import { DetailProvider } from "@/lib/detailContext";
import { RunProvider } from "@/lib/runContext";
import Home from "@/pages/Home";
import NotFound from "@/pages/not-found";

function AppRouter() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider delayDuration={150}>
        <AuthProvider>
          <I18nProvider>
            <AppProvider>
              <RunProvider>
                <DetailProvider>
                  <Toaster />
                  <Router hook={useHashLocation}>
                    <AppRouter />
                  </Router>
                </DetailProvider>
              </RunProvider>
            </AppProvider>
          </I18nProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
