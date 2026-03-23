import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { authApi } from "@/services/api";

interface User {
  id: string;
  email: string;
  full_name: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, fullName: string) => Promise<string>;
  forgotPassword: (email: string) => Promise<string>;
  resetPassword: (token: string, password: string) => Promise<string>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => {},
  signup: async () => "",
  forgotPassword: async () => "",
  resetPassword: async () => "",
  signOut: () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (token) {
      authApi.me()
        .then(setUser)
        .catch(() => {
          localStorage.removeItem("auth_token");
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const res = await authApi.login(email, password);
    localStorage.setItem("auth_token", res.token);
    setUser(res.user);
  };

  const signup = async (email: string, password: string, fullName: string) => {
    const res = await authApi.signup(email, password, fullName);
    return res.message;
  };

  const forgotPassword = async (email: string) => {
    const res = await authApi.forgotPassword(email);
    return res.message;
  };

  const resetPassword = async (token: string, password: string) => {
    const res = await authApi.resetPassword(token, password);
    return res.message;
  };

  const signOut = () => {
    localStorage.removeItem("auth_token");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, forgotPassword, resetPassword, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
