import { Navigate } from "react-router-dom";
import { useAuthStore } from "../store/auth";

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const { session, initialized } = useAuthStore();
  if (!initialized) return null;
  if (!session) return <Navigate to="/login" replace />;
  return <>{children}</>;
}