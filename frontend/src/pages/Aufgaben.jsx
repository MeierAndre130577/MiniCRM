import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { tasks } from '../lib/api'

const TYPE_LABELS = {
  kategorie_zuordnen: 'Kategorie zuordnen',
  termin_pruefen:     'Termin prüfen',
  manual:             'Manuell',
}

const TYPE_COLORS = {
  kategorie_zuordnen: { bg: '#fef9c3', color: '#a16207', border: '#fde68a' },
  termin_pruefen:     { bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe' },
  manual:             { bg: '#f3f4f6', color: '#6b7280', border: '#d1d5db' },
}

export default function Aufgaben() {
  const [list, setList]       = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  async function load() {
    setLoading(true)
    try {
      const data = await tasks.list()
      setList(data)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  async function markDone(id) {
    await tasks.done(id)
    setList(l => l.filter(t => t.id !== id))
  }

  async function deleteTask(id) {
    await tasks.delete(id)
    setList(l => l.filter(t => t.id !== id))
  }

  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-title">Aufgaben</div>
          <div className="page-sub">{list.length} offen</div>
        </div>
      </div>

      {loading ? (
        <div style={{ color: 'var(--muted)', padding: 24 }}>Laden…</div>
      ) : list.length === 0 ? (
        <div className="card" style={{ color: 'var(--muted)', fontSize: 14 }}>
          Keine offenen Aufgaben.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {list.map(t => {
            const tc = TYPE_COLORS[t.type] || TYPE_COLORS.manual
            const kundenname = t.p1_vorname ? `${t.p1_vorname} ${t.p1_nachname}`.trim() : null
            return (
              <div key={t.id} className="card" style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                    <span style={{
                      padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                      background: tc.bg, color: tc.color, border: `1px solid ${tc.border}`,
                    }}>{TYPE_LABELS[t.type] || t.type}</span>
                    <span style={{ fontWeight: 700, fontSize: 14 }}>{t.title}</span>
                  </div>
                  {t.description && (
                    <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 6 }}>{t.description}</div>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                    {kundenname && (
                      <button
                        type="button"
                        onClick={() => navigate(`/kunden/${t.customer_id}?tab=stammdaten`)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary, #2563eb)', fontSize: 12, padding: 0, textDecoration: 'underline' }}>
                        → {kundenname}
                      </button>
                    )}
                    {t.type === 'kategorie_zuordnen' && (
                      <button type="button"
                        onClick={() => navigate('/einstellungen?section=lead')}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#2563eb', fontSize: 12, padding: 0, textDecoration: 'underline' }}>
                        → Mapping in Einstellungen ergänzen
                      </button>
                    )}
                    {t.type === 'termin_pruefen' && t.customer_id && (
                      <button type="button"
                        onClick={() => navigate(`/kunden/${t.customer_id}?tab=termine`)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#2563eb', fontSize: 12, padding: 0, textDecoration: 'underline' }}>
                        → Termine öffnen
                      </button>
                    )}
                    <span style={{ fontSize: 11, color: 'var(--muted)' }}>
                      {new Date(t.created_at).toLocaleDateString('de-DE')}
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <button type="button" className="btn btn-primary btn-sm" onClick={() => markDone(t.id)}>
                    ✓ Erledigt
                  </button>
                  <button type="button" className="btn btn-ghost btn-sm" style={{ color: 'var(--red)' }}
                    onClick={() => deleteTask(t.id)}>
                    Löschen
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}
