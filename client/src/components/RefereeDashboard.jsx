
import React, { useEffect, useState } from 'react'
import { api } from '../api.js'

const DOW = ["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"]

export default function RefereeDashboard({ session, onLogout }){
  const [availability, setAvailability] = useState([])

  async function load(){
    const items = await api(`/api/availability/${session.refereeId}`)
    setAvailability(items)
  }
  useEffect(()=>{ load() }, [])

  async function add(e){
    e.preventDefault()
    const fd = new FormData(e.target)
    const body = Object.fromEntries(fd.entries())
    body.dayOfWeek = Number(body.dayOfWeek)
    body.refereeId = session.refereeId
    const item = await api('/api/availability', { method:'POST', body: JSON.stringify(body)})
    setAvailability(prev=>[...prev, item])
    e.target.reset()
  }

  async function remove(id){
    await api(`/api/availability/${id}`, { method:'DELETE' })
    setAvailability(prev=>prev.filter(x=>x.id!==id))
  }

  return <div className="min-h-screen p-4 md:p-8 space-y-6">
    <div className="flex items-center justify-between">
      <h1 className="text-2xl font-bold">Mi disponibilidad</h1>
      <button onClick={onLogout} className="px-3 py-2 rounded-xl border">Salir</button>
    </div>

    <form className="bg-white p-4 rounded-2xl shadow grid md:grid-cols-4 gap-3" onSubmit={add}>
      <select name="dayOfWeek" className="border rounded-xl p-2">
        {DOW.map((d,i)=><option key={i} value={i}>{d}</option>)}
      </select>
      <input name="from" type="time" required className="border rounded-xl p-2" />
      <input name="to" type="time" required className="border rounded-xl p-2" />
      <button className="bg-gray-900 text-white rounded-xl py-2">Agregar</button>
    </form>

    <ul className="space-y-2">
      {availability.map(a => <li key={a.id} className="bg-white p-3 rounded-2xl shadow flex justify-between">
        <span>{DOW[a.dayOfWeek]} · {a.from}–{a.to}</span>
        <button onClick={()=>remove(a.id)} className="text-sm text-red-600">Quitar</button>
      </li>)}
    </ul>
  </div>
}
