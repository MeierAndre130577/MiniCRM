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
  overdue: { background: '#fef2f2', color: '#dc2626', border: '#fecaca', dot: '#dc2626', label: 'Überfällig' },
  today:   { background: '#fffbeb', color: '#d97706', border: '#fde68a', dot: '#f59e0b', label: 'Heute' },
  future:  { background: '#f0fdf4', color: '#16a34a', border: '#bbf7d0', dot: '#16a34a', label: 'Geplant' },
  none:    { background: '#f9fafb', color: '#6b7280', border: '#e5e7eb', dot: '#9ca3af', label: '' },
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
    <div style={{ padding: 32, maxWidth: 1100 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Terminübersicht</h1>
          <p style={{ margin: '4px 0 0', color: 'var(--muted)', fontSize: 13 }}>
            Folgetermine aller zugewiesenen Kunden
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          {overdue > 0 && (
            <span style={{
              background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca',
              borderRadius: 20, fontSize: 12, fontWeight: 700, padding: '4px 12px',
            }}>
              {overdue} überfällig
            </span>
          )}
          {today > 0 && (
            <span style={{
              background: '#fffbeb', color: '#d97706', border: '1px solid #fde68a',
              borderRadius: 20, fontSize: 12, fontWeight: 700, padding: '4px 12px',
            }}>
              {today} heute
            </span>
          )}
        </div>
      </div>

      {/* Berater-Filter */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        <button
          onClick={() => setBerater('alle')}
          style={{
            padding: '6px 16px', borderRadius: 20, fontSize: 13, fontWeight: 600, cursor: 'pointer',
            border: berater === 'alle' ? '2px solid var(--accent)' : '2px solid var(--line)',
            background: berater === 'alle' ? 'var(--accent)' : 'transparent',
            color: berater === 'alle' ? '#fff' : 'var(--text)',
          }}
        >
          Alle ({rows.length})
        </button>
        {BERATER.map(b => (
          <button
            key={b}
            onClick={() => setBerater(b)}
            style={{
              padding: '6px 16px', borderRadius: 20, fontSize: 13, fontWeight: 600, cursor: 'pointer',
              border: berater === b ? '2px solid var(--accent)' : '2px solid var(--line)',
              background: berater === b ? 'var(--accent)' : 'transparent',
              color: berater === b ? '#fff' : 'var(--text)',
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
        <div style={{
          background: 'var(--card)', border: '1px solid var(--line)',
          borderRadius: 12, overflow: 'hidden',
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ background: 'var(--bg)', borderBottom: '2px solid var(--line)' }}>
                <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--muted)', fontSize: 12, width: 110 }}>Status</th>
                <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--muted)', fontSize: 12, width: 110 }}>Datum</th>
                <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--muted)', fontSize: 12 }}>Kunde</th>
                {berater === 'alle' && (
                  <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--muted)', fontSize: 12, width: 150 }}>Berater</th>
                )}
                <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--muted)', fontSize: 12 }}>Notiz</th>
                <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--muted)', fontSize: 12, width: 160 }}>Letzter Kontakt</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, i) => {
                const st = getDateStatus(r.folgetermin_datum)
                const s  = STATUS_STYLE[st]
                return (
                  <tr
                    key={r.id}
                    onClick={() => navigate(`/kunden/${r.id}?tab=termine`)}
                    style={{
                      borderBottom: i < filtered.length - 1 ? '1px solid var(--line)' : 'none',
                      cursor: 'pointer',
                      transition: 'background 0.1s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 5,
                        padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                        background: s.background, color: s.color,
                        border: `1px solid ${s.border}`,
                      }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.dot, flexShrink: 0 }} />
                        {s.label}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: 600, color: s.color }}>
                      {datumLabel(r.folgetermin_datum)}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: 600 }}>
                        {r.p1_vorname} {r.p1_nachname}
                      </div>
                      {(r.p1_handy || r.p1_email) && (
                        <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
                          {r.p1_handy || r.p1_email}
                        </div>
                      )}
                    </td>
                    {berater === 'alle' && (
                      <td style={{ padding: '12px 16px', color: 'var(--muted)', fontSize: 13 }}>
                        {r.berater || '—'}
                      </td>
                    )}
                    <td style={{ padding: '12px 16px', color: 'var(--muted)', fontSize: 13, maxWidth: 260 }}>
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {r.folgetermin_notizen || '—'}
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 12 }}>
                      {r.letzter_status ? (
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--text)' }}>{r.letzter_status}</div>
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
    </div>
  )
}
