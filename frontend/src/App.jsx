import { Routes, Route, NavLink, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Kundenliste        from './pages/Kundenliste'
import Kundenakte         from './pages/Kundenakte'
import AdminEinstellungen from './pages/AdminEinstellungen'
import Aufgaben           from './pages/Aufgaben'
import TestSimulation     from './pages/TestSimulation'
import { tasks } from './lib/api'

const KUNDE_TABS = [
  { key: 'uebersicht',      icon: '📋', label: 'Übersicht' },
  { key: 'stammdaten',      icon: '👤', label: 'Stammdaten' },
  { key: 'kategorien',      icon: '🗂️', label: 'Kategorien' },
  { key: 'ansprechpartner', icon: '🤝', label: 'Ansprechpartner' },
  { key: 'budget',          icon: '💰', label: 'Budget' },
  { key: 'termine',         icon: '📅', label: 'Termine' },
  { key: 'notizen',         icon: '📝', label: 'Notizen' },
]

export default function App() {
  const location = useLocation()
  const navigate = useNavigate()
  const [taskCount, setTaskCount] = useState(0)

  const kundeMatch = location.pathname.match(/^\/kunden\/(\d+)/)
  const kundeId    = kundeMatch ? kundeMatch[1] : null
  const activeTab  = new URLSearchParams(location.search).get('tab') || 'uebersicht'

  useEffect(() => {
    tasks.count().then(r => setTaskCount(r.count)).catch(() => {})
    const iv = setInterval(() => {
      tasks.count().then(r => setTaskCount(r.count)).catch(() => {})
    }, 30000)
    return () => clearInterval(iv)
  }, [location.pathname])

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="box">C</div>
          <span>MiniCRM</span>
        </div>

        {/* Kunden */}
        <div>
          <div className="nav-group-label">Kunden</div>
          <NavLink to="/kunden"
            className={({ isActive }) => `nav-item${isActive && !kundeId ? ' active' : ''}`}>
            <span className="icon">👥</span>
            Kundenliste
          </NavLink>
        </div>

        {/* Kundenakte Tabs — nur wenn ein Kunde geöffnet ist */}
        {kundeId && (
          <>
            <div style={{ height: 1, background: 'var(--line)', margin: '8px 0' }} />
            <div>
              <div className="nav-group-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ color: 'var(--red)' }}>●</span> Kundenakte
              </div>
              {KUNDE_TABS.map(t => (
                <button key={t.key}
                  onClick={() => navigate(`/kunden/${kundeId}?tab=${t.key}`)}
                  className={`nav-item${activeTab === t.key ? ' active' : ''}`}
                  style={{ width: '100%', textAlign: 'left', border: 'none', cursor: 'pointer', background: 'none' }}>
                  <span className="icon">{t.icon}</span>
                  {t.label}
                </button>
              ))}
            </div>
          </>
        )}

        {/* Admin — immer sichtbar, visuell abgegrenzt */}
        <div style={{ marginTop: 'auto', paddingTop: 12, borderTop: '2px solid var(--line)' }}>
          <div className="nav-group-label">Admin</div>
          <NavLink to="/aufgaben"
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            <span className="icon">✅</span>
            Aufgaben
            {taskCount > 0 && (
              <span style={{
                marginLeft: 'auto', background: 'var(--red)', color: 'white',
                borderRadius: 20, fontSize: 11, fontWeight: 700,
                padding: '1px 7px', minWidth: 20, textAlign: 'center',
              }}>{taskCount}</span>
            )}
          </NavLink>
          <NavLink to="/einstellungen"
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            <span className="icon">⚙️</span>
            Einstellungen
          </NavLink>
          <NavLink to="/test-simulation"
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            <span className="icon">🧪</span>
            Test-Simulation
          </NavLink>
        </div>
      </aside>

      <main className="main">
        <Routes>
          <Route path="/"               element={<Navigate to="/kunden" replace />} />
          <Route path="/kunden"         element={<Kundenliste />} />
          <Route path="/kunden/:id"     element={<Kundenakte />} />
          <Route path="/aufgaben"       element={<Aufgaben />} />
          <Route path="/einstellungen"   element={<AdminEinstellungen />} />
          <Route path="/test-simulation" element={<TestSimulation />} />
        </Routes>
      </main>
    </div>
  )
}
