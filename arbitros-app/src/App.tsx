import { BrowserRouter, Routes, Route, Navigate, Link } from "react-router-dom";
import "./index.css";
import Login from "./pages/Login";
import Disponibilidad from "./pages/Disponibilidad";
import Admin from "./pages/Admin";
import AuthGate from "./components/AuthGate";
import { useAuthStore } from "./store/auth";

function Layout({ children }: { children: React.ReactNode }) {
  const { session, signOut } = useAuthStore();
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="border-b bg-white">
        <div className="container-responsive flex items-center justify-between py-4">
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-indigo-600" />
            <span className="font-semibold">Asignador de Árbitros</span>
          </div>
          <nav className="flex items-center gap-4 text-sm">
            <Link className="hover:text-indigo-600" to="/disponibilidad">Disponibilidad</Link>
            <Link className="hover:text-indigo-600" to="/admin">Admin</Link>
            {session ? (
              <button onClick={signOut} className="rounded-md border px-3 py-1 hover:bg-gray-50">Salir</button>
            ) : (
              <Link className="rounded-md border px-3 py-1 hover:bg-gray-50" to="/login">Ingresar</Link>
            )}
          </nav>
        </div>
      </header>
      <main className="container-responsive py-6">{children}</main>
      <footer className="mt-10 border-t bg-white">
        <div className="container-responsive py-4 text-xs text-gray-500">
          © {new Date().getFullYear()} Colegio de Árbitros
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/disponibilidad" element={<AuthGate><Disponibilidad /></AuthGate>} />
          <Route path="/admin" element={<AuthGate><Admin /></AuthGate>} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
