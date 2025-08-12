import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useAuthStore } from "../store/auth";
import { Navigate } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const { session, ensureRefereeProfile } = useAuthStore();

  useEffect(() => {
    if (session) ensureRefereeProfile();
  }, [session]);

  if (session) return <Navigate to="/disponibilidad" replace />;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin } });
      setSent(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md space-y-4 rounded-lg border bg-white p-6">
      <h1 className="text-xl font-semibold">Ingreso</h1>
      {sent ? (
        <p className="text-sm text-green-700">Te enviamos un link de acceso a {email}.</p>
      ) : (
        <form className="space-y-3" onSubmit={onSubmit}>
          <input
            className="w-full rounded-md border px-3 py-2"
            placeholder="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <button
            disabled={loading}
            className="w-full rounded-md bg-indigo-600 px-3 py-2 text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? "Enviando..." : "Continuar"}
          </button>
        </form>
      )}
    </div>
  );
}