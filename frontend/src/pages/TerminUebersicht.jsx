import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { termine } from '../lib/api'

const BERATER = ['Thomas Schmidt', 'Tatjana Schmidt', 'Markus Maurer', 'Silvia Dürst']

function datumLabel(dateStr) {
  if (!dateStr) return '—'
  const [y, m, d] = dateStr.split('-')
  return `${d}.${m}.${y}`
}

function getDateStatus(dateStr) {
  if (!dateStr) return 'none'
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const dt = new Date(dateStr)
  dt.setHours(0, 0, 0, 0)
  if (dt < today) return 'overdue'
  if (dt.getTime() === today.getTime()) return 'today'
  return 'future'
}

const STATUS_STYLE = {
  overdue: { bg: 'var(--status-ov-bg)', color: 'var(--status-ov-c)', border: 'var(--status-ov-b)', label: 'Überfällig' },
  today:   { bg: 'var(--status-td-bg)', color: 'var(--status-td-c)', border: 'var(--status-td-b)', label: 'Heute' },
  future:  { bg: 'var(--status-fu-bg)', color: 'var(--status-fu-c)', border: 'var(--status-fu-b)', label: 'Geplant' },
  none:    { bg: 'var(--section-bg)',   color: 'var(--muted)',        border: 'var(--line)',         label: '' },
}

export default function TerminUebersicht() {
  const [rows, setRows]       = useState([])
  const [loading, setLoading] = useState(true)
  const [berater, setBerater] = useState('alle')
  const navigate = useNavigate()

  useEffect(() => {
    termine.uebersicht()
      .then(setRows)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const counts = {}
  for (const r of rows) {
    const b = r.berater || '—'
    counts[b] = (counts[b] || 0) + 1
  }

  const filtered = berater === 'alle'
    ? rows
    : rows.filter(r => r.berater === berater)

  const overdue = filtered.filter(r => getDateStatus(r.folgetermin_datum) === 'overdue').length
  const today   = filtered.filter(r => getDateStatus(r.folgetermin_datum) === 'today').length

  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-title">Terminübersicht</div>
          <div className="page-sub">Folgetermine aller zugewiesenen Kunden</div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          {overdue > 0 && (
            <span style={{
              background: 'var(--status-ov-bg)', color: 'var(--status-ov-c)',
              border: '1px solid var(--status-ov-b)',
              borderRadius: 20, fontSize: 12, fontWeight: 700, padding: '4px 12px',
            }}>
              {overdue} überfällig
            </span>
          )}
          {today > 0 && (
            <span style={{
              background: 'var(--status-td-bg)', color: 'var(--status-td-c)',
              border: '1px solid var(--status-td-b)',
              borderRadius: 20, fontSize: 12, fontWeight: 700, padding: '4px 12px',
            }}>
              {today} heute
            </span>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        <button
          onClick={() => setBerater('alle')}
          style={{
            padding: '6px 16px', borderRadius: 20, fontSize: 13, fontWeight: 700, cursor: 'pointer',
            border: berater === 'alle' ? '2px solid var(--accent)' : '2px solid var(--line)',
            background: berater === 'alle' ? 'var(--accent)' : 'var(--white)',
            color: berater === 'alle' ? '#fff' : 'var(--muted)',
            boxShadow: berater === 'alle' ? '0 2px 8px rgba(0,0,0,0.15)' : 'none',
          }}
        >
          Alle ({rows.length})
        </button>
        {BERATER.map(b => (
          <button
            key={b}
            onClick={() => setBerater(b)}
            style={{
              padding: '6px 16px', borderRadius: 20, fontSize: 13, fontWeight: 700, cursor: 'pointer',
              border: berater === b ? '2px solid var(--accent)' : '2px solid var(--line)',
              background: berater === b ? 'var(--accent)' : 'var(--white)',
              color: berater === b ? '#fff' : 'var(--muted)',
              boxShadow: berater === b ? '0 2px 8px rgba(0,0,0,0.15)' : 'none',
            }}
          >
            {b.split(' ')[0]} ({counts[b] || 0})
          </button>
        ))}
      </div>

      {loading ? (
        <p style={{ color: 'var(--muted)' }}>Lade…</p>
      ) : filtered.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '60px 0', color: 'var(--muted)',
          border: '2px dashed var(--line)', borderRadius: 12,
        }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>📅</div>
          <div style={{ fontWeight: 600 }}>Keine Folgetermine eingetragen</div>
          <div style={{ fontSize: 13, marginTop: 4 }}>Folgetermin-Datum in der Kundenakte erfassen</div>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: 110 }}>Status</th>
                <th style={{ width: 110 }}>Datum</th>
                <th>Kunde</th>
                {berater === 'alle' && <th style={{ width: 150 }}>Berater</th>}
                <th>Notiz</th>
                <th style={{ width: 160 }}>Letzter Kontakt</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => {
                const st = getDateStatus(r.folgetermin_datum)
                const s  = STATUS_STYLE[st]
                return (
                  <tr
                    key={r.id}
                    onClick={() => navigate(`/kunden/${r.id}?tab=termine`)}
                  >
                    <td>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 5,
                        padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                        background: s.bg, color: s.color, border: `1px solid ${s.border}`,
                      }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
                        {s.label}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600, color: s.color }}>
                      {datumLabel(r.folgetermin_datum)}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>
                        {r.p1_nachname} {r.p1_vorname}
                      </div>
                      {(r.p1_handy || r.p1_email) && (
                        <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
                          {r.p1_handy || r.p1_email}
                        </div>
                      )}
                    </td>
                    {berater === 'alle' && (
                      <td style={{ color: 'var(--muted)', fontSize: 13 }}>
                        {r.berater || '—'}
                      </td>
                    )}
                    <td style={{ color: 'var(--muted)', fontSize: 13, maxWidth: 260 }}>
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {r.folgetermin_notizen || '—'}
                      </div>
                    </td>
                    <td style={{ fontSize: 12 }}>
                      {r.letzter_status ? (
                        <div>
                          <div style={{ fontWeight: 600 }}>{r.letzter_status}</div>
                          {r.letzter_termin_datum && (
                            <div style={{ color: 'var(--muted)', marginTop: 1 }}>
                              {datumLabel(r.letzter_termin_datum)}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span style={{ color: 'var(--muted)' }}>—</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
