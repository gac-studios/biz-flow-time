import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Onboarding from "./pages/Onboarding";
import DashboardLayout from "./components/DashboardLayout";
import StaffLayout from "./components/StaffLayout";
import Agenda from "./pages/dashboard/Agenda";
import Staff from "./pages/dashboard/Staff";
import SettingsPage from "./pages/dashboard/SettingsPage";
import ProductivityPage from "./pages/dashboard/ProductivityPage";
import AuditPage from "./pages/dashboard/AuditPage";
import StaffAppointments from "./pages/staff/StaffAppointments";
import StaffNewAppointment from "./pages/staff/StaffNewAppointment";
import StaffReport from "./pages/staff/StaffReport";
import Clients from "./pages/dashboard/Clients";
import PublicBooking from "./pages/PublicBooking";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/onboarding" element={
              <ProtectedRoute requireRole={false}>
                <Onboarding />
              </ProtectedRoute>
            } />
            <Route path="/dashboard" element={
              <ProtectedRoute allowedRoles={["owner"]}>
                <DashboardLayout />
              </ProtectedRoute>
            }>
              <Route index element={<Agenda />} />
              <Route path="clients" element={<Clients />} />
              <Route path="staff" element={<Staff />} />
              <Route path="productivity" element={<ProductivityPage />} />
              <Route path="audit" element={<AuditPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>
            <Route path="/staff" element={
              <ProtectedRoute allowedRoles={["staff"]}>
                <StaffLayout />
              </ProtectedRoute>
            }>
              <Route index element={<StaffAppointments />} />
              <Route path="new" element={<StaffNewAppointment />} />
              <Route path="report" element={<StaffReport />} />
            </Route>
            <Route path="/c/:slug" element={<PublicBooking />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
