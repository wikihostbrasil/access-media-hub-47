import { Routes, Route, Navigate } from "react-router-dom";
import { BrowserRouter } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AppSidebar } from "@/components/AppSidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useApiAuth } from "@/hooks/useApiAuth";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

// Pages
import Index from "@/pages/Index";
import Auth from "@/pages/Auth";
import NotFound from "@/pages/NotFound";
import Files from "@/pages/Files";
import Users from "@/pages/Users";
import Groups from "@/pages/Groups";
import Categories from "@/pages/Categories";
import Downloads from "@/pages/Downloads";
import Reports from "@/pages/Reports";
import Settings from "@/pages/Settings";
import Profile from "@/pages/Profile";
import AccessLogs from "@/pages/AccessLogs";
import SignupSuccess from "@/pages/SignupSuccess";


const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

function AuthenticatedApp() {
  const { user, loading, signOut } = useApiAuth();
  const profile = user ? { role: user.role } : null;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Carregando...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route path="/auth/reset-password" element={<Auth />} />
          <Route path="/auth/confirm" element={<Auth />} />
          <Route path="/signup-success" element={<SignupSuccess />} />
          
          <Route path="*" element={<Navigate to="/auth" replace />} />
        </Routes>
      </>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col">
          <header className="h-16 flex items-center justify-between border-b px-6">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <h1 className="text-xl font-semibold">Gerenciador de Downloads</h1>
            </div>
            
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <Button variant="ghost" size="sm" onClick={signOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </Button>
            </div>
          </header>

          <main className="flex-1 p-6">
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/files" element={<Files />} />
              {profile?.role !== 'user' && <Route path="/users" element={<Users />} />}
              {profile?.role !== 'user' && <Route path="/groups" element={<Groups />} />}
              {profile?.role !== 'user' && <Route path="/categories" element={<Categories />} />}
              {profile?.role === 'admin' && <Route path="/downloads" element={<Downloads />} />}
              {profile?.role === 'admin' && <Route path="/reports" element={<Reports />} />}
              {profile?.role === 'admin' && <Route path="/access-logs" element={<AccessLogs />} />}
              {profile?.role !== 'user' && <Route path="/settings" element={<Settings />} />}
              <Route path="/profile" element={<Profile />} />
              <Route path="/auth" element={<Navigate to="/" replace />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter>
        <AuthenticatedApp />
        <Toaster />
        <Sonner />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
