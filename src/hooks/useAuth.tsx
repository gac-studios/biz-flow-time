import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type AppRole = "owner" | "staff" | null;

interface AuthContextType {
  session: Session | null;
  user: User | null;
  role: AppRole;
  companyId: string | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  role: null,
  companyId: null,
  loading: true,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<AppRole>(null);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMembership = async (userId: string) => {
    const { data } = await supabase
      .from("memberships")
      .select("role, company_id")
      .eq("user_id", userId)
      .eq("active", true)
      .limit(1)
      .single();

    if (data) {
      setRole(data.role as AppRole);
      setCompanyId(data.company_id);
    } else {
      setRole(null);
      setCompanyId(null);
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          setTimeout(() => fetchMembership(session.user.id), 0);
        } else {
          setRole(null);
          setCompanyId(null);
        }
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchMembership(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setRole(null);
    setCompanyId(null);
  };

  return (
    <AuthContext.Provider value={{ session, user, role, companyId, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
