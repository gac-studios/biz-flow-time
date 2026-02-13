import { Link, useLocation, Outlet, useNavigate } from "react-router-dom";
import { Calendar, UserCog, Settings, Menu, LogOut, BarChart3, ClipboardList, Users } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useAuth } from "@/hooks/useAuth";

const navItems = [
  { path: "/dashboard", label: "Agenda", icon: Calendar },
  { path: "/dashboard/clients", label: "Clientes", icon: Users },
  { path: "/dashboard/staff", label: "Colaboradores", icon: UserCog },
  { path: "/dashboard/productivity", label: "Produtividade", icon: BarChart3 },
  { path: "/dashboard/audit", label: "Auditoria", icon: ClipboardList },
  { path: "/dashboard/settings", label: "Configurações", icon: Settings },
];

const SidebarContent = ({ pathname, onNavigate, onLogout }: { pathname: string; onNavigate?: () => void; onLogout: () => void }) => (
  <div className="flex flex-col h-full">
    <div className="p-6">
      <Link to="/dashboard" className="font-heading text-xl font-bold text-sidebar-primary flex items-center gap-2">
        <Calendar className="h-6 w-6" /> AgendaPro
      </Link>
    </div>
    <nav className="flex-1 px-3 space-y-1">
      {navItems.map((item) => {
        const isActive = pathname === item.path;
        return (
          <Link
            key={item.path}
            to={item.path}
            onClick={onNavigate}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
              isActive ? "bg-sidebar-accent text-sidebar-primary font-medium" : "text-sidebar-foreground hover:bg-sidebar-accent/50"
            }`}
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </Link>
        );
      })}
    </nav>
    <div className="p-4 border-t border-sidebar-border">
      <button
        onClick={onLogout}
        className="flex items-center gap-3 px-3 py-2 text-sm text-sidebar-foreground hover:text-destructive transition-colors w-full"
      >
        <LogOut className="h-5 w-5" /> Sair
      </button>
    </div>
  </div>
);

const DashboardLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex">
      <aside className="hidden lg:flex w-64 bg-sidebar border-r border-sidebar-border flex-col fixed h-full z-40">
        <SidebarContent pathname={location.pathname} onLogout={handleLogout} />
      </aside>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-64 p-0 bg-sidebar border-sidebar-border">
          <SidebarContent pathname={location.pathname} onNavigate={() => setMobileOpen(false)} onLogout={handleLogout} />
        </SheetContent>
      </Sheet>

      <main className="flex-1 lg:ml-64">
        <header className="h-16 border-b border-border bg-card flex items-center justify-between px-4 lg:px-8 sticky top-0 z-30">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3 ml-auto">
            <div className="text-right">
              <p className="text-sm font-medium">{user?.user_metadata?.full_name || user?.email || "Usuário"}</p>
              <p className="text-xs text-muted-foreground">Owner</p>
            </div>
            <div className="h-9 w-9 rounded-full gradient-primary flex items-center justify-center text-sm font-bold text-primary-foreground">
              {(user?.user_metadata?.full_name || user?.email || "U").charAt(0).toUpperCase()}
            </div>
          </div>
        </header>
        <div className="p-4 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
