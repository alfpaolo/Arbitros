
import React, { useEffect, useState } from 'react'
import { api } from './api.js'
import Login from './components/Login.jsx'
import AdminDashboard from './components/AdminDashboard.jsx'
import RefereeDashboard from './components/RefereeDashboard.jsx'

export default function App(){
  const [session, setSession] = useState(null)

  if(!session){
    return <div className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-md p-6 bg-white shadow rounded-2xl">
        <h1 className="text-2xl font-bold mb-4 text-gray-900">Asignador de Árbitros</h1>
        <Login onLogin={setSession} />
        <p className="text-xs text-gray-500 mt-4">Demo sin password. Implementa auth real en producción.</p>
      </div>
    </div>
  }

  if(session.role === 'admin'){
    return <AdminDashboard session={session} onLogout={()=>setSession(null)} />
  }
  return <RefereeDashboard session={session} onLogout={()=>setSession(null)} />
}
