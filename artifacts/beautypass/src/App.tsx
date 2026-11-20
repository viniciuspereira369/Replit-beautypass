import { useEffect, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { IslandToaster } from '@/components/island-toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, useLocation, Router as WouterRouter } from 'wouter';
import { ClientShell, Splash, TopBar, useView } from '@/components/shell';
import HomePage from '@/pages/home';
import MapPage from '@/pages/map';
import PedirPage from '@/pages/pedir';
import SalonPage from '@/pages/salon';
import CheckoutPage from '@/pages/checkout';
import ReservasPage, { ConfirmadoPage } from '@/pages/reservas';
import PerfilPage from '@/pages/perfil';
import PainelPage from '@/pages/painel';

const queryClient = new QueryClient();

function Router() {
  const [loc] = useLocation(); const [view, setView] = useView();
  const b2b = loc.startsWith('/painel');
  useEffect(() => {
    const section = loc.startsWith('/salao/') ? 'Salão e agenda' :
      loc.startsWith('/confirmado/') ? 'Reserva confirmada' :
      ({ '/': 'Sua beleza, no seu tempo.', '/mapa': 'Mapa de salões', '/pedir': 'Pedir Agora', '/checkout': 'Confirmar reserva', '/reservas': 'Minhas reservas', '/perfil': 'Passaporte & Ajustes', '/painel': 'Painel Salão B2B' } as Record<string, string>)[loc] ?? 'Página não encontrada';
    document.title = `BeautyPass — ${section}`;
  }, [loc]);
  return (
    <>
      <TopBar view={view} setView={setView} />
      {b2b ? (
        <div className="overflow-x-auto"><RoutedErrorBoundary><PainelPage /></RoutedErrorBoundary></div>
      ) : (
        <ClientShell framed={view === 'phone'}>
          <RoutedErrorBoundary>
            <Switch>
              <Route path="/" component={HomePage} />
              <Route path="/mapa" component={MapPage} />
              <Route path="/pedir" component={PedirPage} />
              <Route path="/salao/:id" component={SalonPage} />
              <Route path="/checkout" component={CheckoutPage} />
              <Route path="/reservas" component={ReservasPage} />
              <Route path="/confirmado/:code" component={ConfirmadoPage} />
              <Route path="/perfil" component={PerfilPage} />
              <Route component={NotFound} />
            </Switch>
          </RoutedErrorBoundary>
        </ClientShell>
      )}
    </>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <IslandToaster />
        <Splash />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
