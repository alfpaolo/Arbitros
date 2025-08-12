import { useEffect, useState } from "react";
import dayjs from "dayjs";
import { supabase } from "../lib/supabaseClient";
import { useAuthStore } from "../store/auth";

type Availability = {
  id: string;
  start_time: string;
  end_time: string;
};

export default function Disponibilidad() {
  const { referee, ensureRefereeProfile } = useAuthStore();
  const [items, setItems] = useState<Availability[]>([]);
  const [date, setDate] = useState<string>(dayjs().format("YYYY-MM-DD"));
  const [start, setStart] = useState("18:00");
  const [end, setEnd] = useState("22:00");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const init = async () => {
      await ensureRefereeProfile();
      await load();
    };
    init();
  }, []);

  const load = async () => {
    if (!referee) return;
    const { data } = await supabase
      .from("availability")
      .select("id,start_time,end_time")
      .eq("referee_id", referee.id)
      .order("start_time");
    setItems((data ?? []).map((r) => ({ ...r })) as Availability[]);
  };

  const addRange = async () => {
    if (!referee) return;
    setLoading(true);
    const startTs = dayjs(`${date}T${start}`).toISOString();
    const endTs = dayjs(`${date}T${end}`).toISOString();
    await supabase.from("availability").insert({ referee_id: referee.id, start_time: startTs, end_time: endTs });
    await load();
    setLoading(false);
  };

  const remove = async (id: string) => {
    await supabase.from("availability").delete().eq("id", id);
    await load();
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Mi disponibilidad</h2>
      <div className="rounded-lg border bg-white p-4">
        <div className="grid gap-3 sm:grid-cols-4">
          <input className="rounded-md border px-3 py-2" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          <input className="rounded-md border px-3 py-2" type="time" value={start} onChange={(e) => setStart(e.target.value)} />
          <input className="rounded-md border px-3 py-2" type="time" value={end} onChange={(e) => setEnd(e.target.value)} />
          <button disabled={loading} onClick={addRange} className="rounded-md bg-indigo-600 px-3 py-2 text-white hover:bg-indigo-700 disabled:opacity-50">Agregar</button>
        </div>
      </div>

      <div className="rounded-lg border bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="px-4 py-2">Inicio</th>
              <th className="px-4 py-2">Fin</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody>
            {items.map((a) => (
              <tr key={a.id} className="border-b last:border-0">
                <td className="px-4 py-2">{dayjs(a.start_time).format("DD/MM/YYYY HH:mm")}</td>
                <td className="px-4 py-2">{dayjs(a.end_time).format("DD/MM/YYYY HH:mm")}</td>
                <td className="px-4 py-2 text-right">
                  <button onClick={() => remove(a.id)} className="rounded-md border px-3 py-1 hover:bg-gray-50">Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}