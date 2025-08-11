
import React, { useEffect, useMemo, useState } from 'react'
import { api } from '../api.js'

function Section({title, children}){
  return <div className="bg-white p-4 rounded-2xl shadow">
    <h2 className="text-lg font-semibold mb-3">{title}</h2>
    {children}
  </div>
}

export default function AdminDashboard({ session, onLogout }){
  const [clubs, setClubs] = useState([])
  const [refs, setRefs] = useState([])
  const [matches, setMatches] = useState([])
  const [assignments, setAssignments] = useState([])
  const [avail, setAvail] = useState([]);


  async function loadAll(){
    const [c,r,m,a] = await Promise.all([
      api('/api/clubs'), api('/api/referees'), api('/api/matches'), api('/api/assignments')
    ])
    setClubs(c); setRefs(r); setMatches(m); setAssignments(a)
  }
  useEffect(()=>{ loadAll() }, [])

  async function addClub(e){
    e.preventDefault()
    const fd = new FormData(e.target)
    const body = Object.fromEntries(fd.entries())
    body.lat = Number(body.lat); body.lon = Number(body.lon)
    const c = await api('/api/clubs', { method:'POST', body: JSON.stringify(body)})
    setClubs(prev=>[...prev, c]); e.target.reset()
  }

  async function addMatch(e){
    e.preventDefault()
    const fd = new FormData(e.target)
    const body = Object.fromEntries(fd.entries())
    const m = await api('/api/matches', { method:'POST', body: JSON.stringify(body)})
    setMatches(prev=>[...prev, m]); e.target.reset()
  }

  async function autoAssign(){
    await api('/api/assignments/auto', { method:'POST' })
    await loadAll()
  }

  return <div className="min-h-screen p-4 md:p-8 space-y-6">
    <div className="flex items-center justify-between">
      <h1 className="text-2xl font-bold">Panel Administrador</h1>
      <button onClick={onLogout} className="px-3 py-2 rounded-xl border">Salir</button>
    </div>

    <div className="grid md:grid-cols-2 gap-6">
      <Section title="Clubes">
        <form className="grid sm:grid-cols-2 gap-3" onSubmit={addClub}>
          <input name="nombre" required placeholder="Nombre" className="border rounded-xl p-2" />
          <input name="direccion" placeholder="Dirección" className="border rounded-xl p-2" />
          <input name="lat" type="number" step="any" required placeholder="Latitud" className="border rounded-xl p-2" />
          <input name="lon" type="number" step="any" required placeholder="Longitud" className="border rounded-xl p-2" />
          <button className="col-span-full bg-gray-900 text-white rounded-xl py-2">Agregar</button>
        </form>
        <ul className="mt-3 space-y-2">
          {clubs.map(c => <li key={c.id} className="flex justify-between items-center">
            <span>{c.nombre} <span className="text-xs text-gray-500">({c.lat},{c.lon})</span></span>
          </li>)}
        </ul>
      </Section>

      <Section title="Partidos">
        <form className="grid sm:grid-cols-2 gap-3" onSubmit={addMatch}>
          <select name="clubLocalId" required className="border rounded-xl p-2">
            <option value="">Local</option>
            {clubs.map(c=><option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
          <select name="clubVisitanteId" required className="border rounded-xl p-2">
            <option value="">Visitante</option>
            {clubs.map(c=><option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
          <select name="clubSedeId" required className="border rounded-xl p-2">
            <option value="">Sede</option>
            {clubs.map(c=><option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
          <input type="date" name="fecha" required className="border rounded-xl p-2" />
          <input type="time" name="hora" required className="border rounded-xl p-2" />
          <select name="categoria" required className="border rounded-xl p-2">
            <option value="U13">U13 (60')</option>
            <option value="U15">U15 (90')</option>
            <option value="U17">U17 (90')</option>
            <option value="Mayor">Mayor (90')</option>
          </select>
          <button className="col-span-full bg-gray-900 text-white rounded-xl py-2">Agregar</button>
        </form>

        <div className="mt-3 space-y-2">
          {matches.map(m => <div key={m.id} className="p-3 rounded-xl border flex justify-between">
            <div>
              <div className="font-medium">{clubs.find(c=>c.id===m.clubLocalId)?.nombre} vs {clubs.find(c=>c.id===m.clubVisitanteId)?.nombre}</div>
              <div className="text-sm text-gray-600">{m.fecha} {m.hora} · {m.categoria} · Sede: {clubs.find(c=>c.id===m.clubSedeId)?.nombre}</div>
            </div>
          </div>)}
        </div>
      </Section>
    </div>

    <Section title="Árbitros">
      <form className="grid sm:grid-cols-2 gap-3" onSubmit={async (e)=>{
        e.preventDefault();
        const fd = new FormData(e.target);
        const body = Object.fromEntries(fd.entries());
        const r = await api('/api/referees', { method:'POST', body: JSON.stringify(body) });
        setRefs(prev => [...prev, r]);
        e.target.reset();
      }}>
        <input name="nombre" required placeholder="Nombre del árbitro" className="border rounded-xl p-2" />
        <button className="bg-gray-900 text-white rounded-xl py-2">Agregar</button>
      </form>

      <ul className="mt-3 space-y-2">
        {refs.map(r => (
          <li key={r.id} className="flex items-center justify-between p-2 border rounded-xl">
            <span>{r.nombre}</span>
            <div className="flex items-center gap-2">
              {/* Renombrar (rápido) */}
              <button
                className="text-sm border rounded-lg px-2 py-1"
                onClick={async ()=>{
                  const nuevo = prompt('Nuevo nombre', r.nombre);
                  if(!nuevo) return;
                  const upd = await api(`/api/referees/${r.id}`, { method:'PUT', body: JSON.stringify({ nombre: nuevo }) });
                  setRefs(prev => prev.map(x => x.id===r.id ? upd : x));
                }}>
                Renombrar
              </button>

              {/* Eliminar */}
              <button
                className="text-sm text-red-600"
                onClick={async ()=>{
                  if(!confirm('¿Eliminar árbitro y su disponibilidad?')) return;
                  await api(`/api/referees/${r.id}`, { method:'DELETE' });
                  setRefs(prev => prev.filter(x => x.id!==r.id));
                }}>
                Eliminar
              </button>
            </div>
          </li>
        ))}
      </ul>
    </Section>

    <Section title="Disponibilidad (vista admin)">
      <div className="grid sm:grid-cols-3 gap-3">
        <select id="refSel" className="border rounded-2xl p-2"
          onChange={async e=>{
            const id = e.target.value;
            if(!id) { setAvail([]); return; }
            const items = await api(`/api/availability/${id}`);
            setAvail(items);
          }}>
          <option value="">Elegir árbitro…</option>
          {refs.map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
        </select>
      </div>
      <ul className="mt-3 space-y-1">
        {avail.map(a => (
          <li key={a.id} className="text-sm text-gray-700">
            {["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"][a.dayOfWeek]} · {a.from}–{a.to}
          </li>
        ))}
        {!avail?.length && <li className="text-sm text-gray-400">Sin datos</li>}
      </ul>
    </Section>

    <Section title="Asignaciones">
      <div className="flex items-center gap-3 mb-3">
        <button onClick={autoAssign} className="bg-emerald-600 text-white rounded-xl px-3 py-2">Asignación automática</button>
        <button onClick={loadAll} className="rounded-xl border px-3 py-2">Actualizar</button>
      </div>
      <div className="space-y-2">
        {matches.map(m => {
          const a = assignments.find(x => x.matchId === m.id)
          const r1 = a ? refs.find(r=>r.id===a.referee1Id) : null
          const r2 = a ? refs.find(r=>r.id===a.referee2Id) : null
          return <div key={m.id} className="p-3 rounded-xl border flex justify-between items-center gap-3">
            <div className="flex-1">
              <div className="font-medium">{clubs.find(c=>c.id===m.clubLocalId)?.nombre} vs {clubs.find(c=>c.id===m.clubVisitanteId)?.nombre}</div>
              <div className="text-sm text-gray-600">{m.fecha} {m.hora} · {m.categoria} · Sede: {clubs.find(c=>c.id===m.clubSedeId)?.nombre}</div>
            </div>
            <div className="flex items-center gap-2">
              <select className="border rounded-xl p-2" value={a?.referee1Id || ''} onChange={async e=>{
                await api(`/api/assignments/${m.id}`, { method:'PATCH', body: JSON.stringify({ referee1Id: e.target.value || null }) })
                await loadAll()
              }}>
                <option value="">Árbitro 1</option>
                {refs.map(r=><option key={r.id} value={r.id}>{r.nombre}</option>)}
              </select>
              <select className="border rounded-xl p-2" value={a?.referee2Id || ''} onChange={async e=>{
                await api(`/api/assignments/${m.id}`, { method:'PATCH', body: JSON.stringify({ referee2Id: e.target.value || null }) })
                await loadAll()
              }}>
                <option value="">Árbitro 2</option>
                {refs.map(r=><option key={r.id} value={r.id}>{r.nombre}</option>)}
              </select>
            </div>
          </div>
        })}
      </div>
    </Section>
  </div>
}
