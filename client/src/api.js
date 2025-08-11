// Usa misma origin si no hay VITE_API_URL
const API = (import.meta.env.VITE_API_URL ?? "");

export async function api(path, opts = {}) {
  const res = await fetch(`${API}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...opts,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
