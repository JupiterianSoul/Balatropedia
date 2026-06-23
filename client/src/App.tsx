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
  // This app is a single-page tab UI. Hash-based deep links (e.g. legacy
  // `#tierlist` URLs) would otherwise resolve to NotFound under wouter's
  // useHashLocation. Render Home for every hash path so deep links and stale
  // bookmarks never 404. NotFound is kept for explicit future use.
  void NotFound;
  return (
    <Switch>
      <Route component={Home} />
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

