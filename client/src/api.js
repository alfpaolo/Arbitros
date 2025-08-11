
const API = import.meta.env.VITE_API_URL || "http://localhost:4000";

export async function api(path, opts={}){
  const res = await fetch(`${API}${path}`, { headers: {'Content-Type':'application/json'}, ...opts });
  if(!res.ok) throw new Error(await res.text());
  return res.json();
}
