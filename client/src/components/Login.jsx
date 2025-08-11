
import React, { useEffect, useState } from 'react'
import { api } from '../api.js'

export default function Login({ onLogin }){
  const [role, setRole] = useState('admin')
  const [referees, setReferees] = useState([])
  const [refereeId, setRefereeId] = useState('')

  useEffect(()=>{
    api('/api/referees').then(setReferees).catch(()=>{})
  },[])

  async function submit(e){
    e.preventDefault()
    const body = role === 'admin' ? { role } : { role, refereeId }
    const r = await api('/api/login', { method:'POST', body: JSON.stringify(body) })
    onLogin(r)
  }

  return <form className="space-y-4" onSubmit={submit}>
    <div className="flex gap-3">
      <button type="button" className={`px-3 py-2 rounded-xl border ${role==='admin'?'bg-gray-900 text-white':'bg-white'}`}
        onClick={()=>setRole('admin')}>Administrador</button>
      <button type="button" className={`px-3 py-2 rounded-xl border ${role==='referee'?'bg-gray-900 text-white':'bg-white'}`}
        onClick={()=>setRole('referee')}>Árbitro</button>
    </div>

    {role==='referee' && (
      <div>
        <label className="block text-sm font-medium">Selecciona tu usuario</label>
        <select className="mt-1 w-full border rounded-xl p-2" value={refereeId} onChange={e=>setRefereeId(e.target.value)} required>
          <option value="">-- Elegir árbitro --</option>
          {referees.map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
        </select>
      </div>
    )}

    <button className="w-full py-2 rounded-xl bg-emerald-600 text-white font-semibold">Ingresar</button>
  </form>
}
