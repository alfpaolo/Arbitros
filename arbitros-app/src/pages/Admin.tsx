import { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import { supabase } from "../lib/supabaseClient";

type Club = { id: string; name: string };
type Category = { id: number; name: string; duration_minutes: number };
type Venue = { id: string; name: string };

type Game = {
  id: string;
  local_club_id: string;
  away_club_id: string;
  venue_id: string | null;
  category_id: number;
  starts_at: string;
};

export default function Admin() {
  // Clubs
  const [clubs, setClubs] = useState<Club[]>([]);
  const [clubName, setClubName] = useState("");

  // Categories/Venues
  const [categories, setCategories] = useState<Category[]>([]);
  const [venues, setVenues] = useState<Venue[]>([]);

  // Games
  const [games, setGames] = useState<Game[]>([]);
  const [newGame, setNewGame] = useState({ local: "", away: "", category: 1, date: dayjs().format("YYYY-MM-DD"), time: "19:00", venue: "" });

  useEffect(() => {
    loadInitial();
  }, []);

  const loadInitial = async () => {
    const [{ data: c }, { data: cats }, { data: v }, { data: g }] = await Promise.all([
      supabase.from("clubs").select("id,name").order("name"),
      supabase.from("categories").select("id,name,duration_minutes").order("id"),
      supabase.from("venues").select("id,name").order("name"),
      supabase.from("games").select("id,local_club_id,away_club_id,venue_id,category_id,starts_at").order("starts_at", { ascending: false }),
    ]);
    setClubs((c ?? []) as Club[]);
    setCategories((cats ?? []) as Category[]);
    setVenues((v ?? []) as Venue[]);
    setGames((g ?? []) as Game[]);
  };

  const addClub = async () => {
    if (!clubName.trim()) return;
    const { data } = await supabase.from("clubs").insert({ name: clubName.trim() }).select("id,name").single();
    if (data) setClubs((prev) => [...prev, data as Club]);
    setClubName("");
  };

  const addGame = async () => {
    const starts_at = dayjs(`${newGame.date}T${newGame.time}`).toISOString();
    const { data } = await supabase
      .from("games")
      .insert({
        local_club_id: newGame.local,
        away_club_id: newGame.away,
        category_id: newGame.category,
        venue_id: newGame.venue || null,
        starts_at,
      })
      .select("id,local_club_id,away_club_id,venue_id,category_id,starts_at")
      .single();
    if (data) setGames((prev) => [data as Game, ...prev]);
  };

  const clubNameById = useMemo(() => Object.fromEntries(clubs.map((c) => [c.id, c.name])), [clubs]);
  const categoryNameById = useMemo(() => Object.fromEntries(categories.map((c) => [c.id, c.name])), [categories]);
  const venueNameById = useMemo(() => Object.fromEntries(venues.map((v) => [v.id, v.name])), [venues]);

  return (
    <div className="space-y-8">
      <section className="rounded-lg border bg-white p-4">
        <h3 className="mb-3 text-base font-semibold">Clubes</h3>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input className="w-full rounded-md border px-3 py-2" placeholder="Nombre del club" value={clubName} onChange={(e) => setClubName(e.target.value)} />
          <button onClick={addClub} className="rounded-md bg-indigo-600 px-3 py-2 text-white hover:bg-indigo-700">Agregar</button>
        </div>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2 md:grid-cols-3">
          {clubs.map((c) => (
            <li key={c.id} className="rounded-md border px-3 py-2 text-sm">{c.name}</li>
          ))}
        </ul>
      </section>

      <section className="rounded-lg border bg-white p-4">
        <h3 className="mb-3 text-base font-semibold">Partidos</h3>
        <div className="grid gap-2 sm:grid-cols-6">
          <select className="rounded-md border px-3 py-2" value={newGame.local} onChange={(e) => setNewGame({ ...newGame, local: e.target.value })}>
            <option value="">Local</option>
            {clubs.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <select className="rounded-md border px-3 py-2" value={newGame.away} onChange={(e) => setNewGame({ ...newGame, away: e.target.value })}>
            <option value="">Visitante</option>
            {clubs.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <select className="rounded-md border px-3 py-2" value={newGame.category} onChange={(e) => setNewGame({ ...newGame, category: Number(e.target.value) })}>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <input className="rounded-md border px-3 py-2" type="date" value={newGame.date} onChange={(e) => setNewGame({ ...newGame, date: e.target.value })} />
          <input className="rounded-md border px-3 py-2" type="time" value={newGame.time} onChange={(e) => setNewGame({ ...newGame, time: e.target.value })} />
          <select className="rounded-md border px-3 py-2" value={newGame.venue} onChange={(e) => setNewGame({ ...newGame, venue: e.target.value })}>
            <option value="">Sede</option>
            {venues.map((v) => (
              <option key={v.id} value={v.id}>{v.name}</option>
            ))}
          </select>
          <div className="sm:col-span-6">
            <button onClick={addGame} className="rounded-md bg-indigo-600 px-3 py-2 text-white hover:bg-indigo-700">Crear Partido</button>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="px-3 py-2">Fecha</th>
                <th className="px-3 py-2">Local</th>
                <th className="px-3 py-2">Visitante</th>
                <th className="px-3 py-2">Categoría</th>
                <th className="px-3 py-2">Sede</th>
              </tr>
            </thead>
            <tbody>
              {games.map((g) => (
                <tr key={g.id} className="border-b last:border-0">
                  <td className="px-3 py-2">{dayjs(g.starts_at).format("DD/MM/YYYY HH:mm")}</td>
                  <td className="px-3 py-2">{clubNameById[g.local_club_id]}</td>
                  <td className="px-3 py-2">{clubNameById[g.away_club_id]}</td>
                  <td className="px-3 py-2">{categoryNameById[g.category_id]}</td>
                  <td className="px-3 py-2">{g.venue_id ? venueNameById[g.venue_id] : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}