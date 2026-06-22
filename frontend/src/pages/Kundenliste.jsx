import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { customers } from '../lib/api'

const BERATER = ['Thomas Schmidt', 'Tatjana Schmidt', 'Markus Maurer', 'Silvia Dürst']

const KONTAKTQUELLEN = ['Dummy', 'Lead', 'Empfehlung', 'Bestandskunde', 'Sonstiges']

const KATEGORIE_META = {
  alter:            { icon: '🧓', short: 'Alter' },
  vermoegen:        { icon: '📈', short: 'Vermögen' },
  einkommensschutz: { icon: '🛡️', short: 'EK-Schutz' },
  gesundheit:       { icon: '🏥', short: 'Gesundheit' },
  wohnwuensche:     { icon: '🏠', short: 'Wohnen' },
  todesfall:        { icon: '⚰️', short: 'Todesfall' },
  haftpflicht:      { icon: '⚖️', short: 'Haftpflicht' },
  hausrat:          { icon: '🛋️', short: 'Hausrat' },
  gebaeude:         { icon: '🏗️', short: 'Gebäude' },
  rechtsschutz:     { icon: '📜', short: 'Rechtsschutz' },
  unfall:           { icon: '🚑', short: 'Unfall' },
  tier:             { icon: '🐕', short: 'Tier' },
  kfz:              { icon: '🚗', short: 'KFZ' },
  kindervorsorge:   { icon: '👶', short: 'Kinder' },
  immobilien:       { icon: '🏢', short: 'Immobilien' },
}

const EMPTY = {
  p1_anrede: '', p1_vorname: '', p1_nachname: '', p1_email: '',
  p1_handy: '', p1_ort: '', p1_beruf: '',
  p2_vorname: '', p2_nachname: '',
  berater: '',
  kontaktquelle: [],
  kontaktquelle_sonstiges: '',
  anfrage_kategorien: [],
}

const TAG_COLORS = {
  Dummy:        { bg: 'var(--tag-dummy-bg)', color: 'var(--tag-dummy-c)', border: 'var(--tag-dummy-b)' },
  Lead:         { bg: 'var(--tag-lead-bg)',  color: 'var(--tag-lead-c)',  border: 'var(--tag-lead-b)' },
  Empfehlung:   { bg: 'var(--tag-empf-bg)',  color: 'var(--tag-empf-c)',  border: 'var(--tag-empf-b)' },
  Bestandskunde:{ bg: 'var(--tag-best-bg)',  color: 'var(--tag-best-c)',  border: 'var(--tag-best-b)' },
  Sonstiges:    { bg: 'var(--tag-sonst-bg)', color: 'var(--tag-sonst-c)', border: 'var(--tag-sonst-b)' },
}

function KontaktTag({ label, small }) {
  const c = TAG_COLORS[label] || TAG_COLORS.Sonstiges
  return (
    <span style={{
      padding: small ? '1px 6px' : '3px 9px',
      borderRadius: 20, fontSize: small ? 10 : 11, fontWeight: 600,
      background: c.bg, color: c.color,
      border: `1px solid ${c.border}`,
      whiteSpace: 'nowrap',
    }}>{label}</span>
  )
}

export default function Kundenliste() {
  const [list, setList]           = useState([])
  const [search, setSearch]       = useState('')
  const [filterKq, setFilterKq]   = useState([])
  const [showNew, setShowNew]     = useState(false)
  const [form, setForm]           = useState(EMPTY)
  const [saving, setSaving]       = useState(false)
  const [sortCol, setSortCol]     = useState('nachname')
  const [sortDir, setSortDir]     = useState('asc')
  const navigate = useNavigate()

  function toggleSort(col) {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortCol(col); setSortDir('asc') }
  }

  function sortIcon(col) {
    if (sortCol !== col) return <span style={{ color: 'var(--line)', marginLeft: 4 }}>↕</span>
    return <span style={{ marginLeft: 4 }}>{sortDir === 'asc' ? '↑' : '↓'}</span>
  }

  useEffect(() => { load() }, [])

  async function load() {
    try { setList(await customers.list()) } catch (e) { console.error(e) }
  }

  function toggleFilter(k) {
    setFilterKq(prev => prev.includes(k) ? prev.filter(x => x !== k) : [...prev, k])
  }

  const filtered = list.filter(c => {
    const q = search.toLowerCase()
    const matchSearch = (
      `${c.p1_vorname} ${c.p1_nachname}`.toLowerCase().includes(q) ||
      (c.p1_email || '').toLowerCase().includes(q) ||
      (c.p1_ort || '').toLowerCase().includes(q)
    )
    const kq = Array.isArray(c.kontaktquelle) ? c.kontaktquelle : []
    const matchFilter = filterKq.length === 0 || filterKq.some(f => kq.includes(f))
    return matchSearch && matchFilter
  })

  const sorted = [...filtered].sort((a, b) => {
    let va, vb
    if (sortCol === 'nachname') {
      va = `${a.p1_nachname || ''} ${a.p1_vorname || ''}`.toLowerCase()
      vb = `${b.p1_nachname || ''} ${b.p1_vorname || ''}`.toLowerCase()
    } else if (sortCol === 'berater') {
      va = (a.berater || '').toLowerCase()
      vb = (b.berater || '').toLowerCase()
    } else if (sortCol === 'folgetermin') {
      va = a.folgetermin_datum || 'zzzz'
      vb = b.folgetermin_datum || 'zzzz'
    } else {
      return 0
    }
    if (va < vb) return sortDir === 'asc' ? -1 : 1
    if (va > vb) return sortDir === 'asc' ? 1 : -1
    return 0
  })

  async function handleCreate(e) {
    e.preventDefault()
    setSaving(true)
    try {
      const c = await customers.create(form)
      setShowNew(false)
      setForm(EMPTY)
      navigate(`/kunden/${c.id}`)
    } catch (err) {
      alert(err.message)
    } finally {
      setSaving(false)
    }
  }

  function toggleKq(k) {
    setForm(f => ({
      ...f,
      kontaktquelle: f.kontaktquelle.includes(k)
        ? f.kontaktquelle.filter(x => x !== k)
        : [...f.kontaktquelle, k]
    }))
  }

  function toggleAnfrage(k) {
    setForm(f => ({
      ...f,
      anfrage_kategorien: f.anfrage_kategorien.includes(k)
        ? f.anfrage_kategorien.filter(x => x !== k)
        : [...f.anfrage_kategorien, k]
    }))
  }

  function statusBadge(besprochen = 0, offen = 0, keinInteresse = 0) {
    const rest = 15 - besprochen - offen - keinInteresse
    const pills = [
      { n: besprochen,   bg: '#16a34a', label: 'Besprochen' },
      { n: offen,        bg: '#f97316', label: 'Offen' },
      { n: keinInteresse,bg: '#dc2626', label: 'Kein Interesse' },
      { n: rest,         bg: '#9ca3af', label: 'Neu' },
    ].filter(p => p.n > 0)
    return (
      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', alignItems: 'center' }}>
        {pills.map(p => (
          <span key={p.label} title={p.label} style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            minWidth: 28, height: 20, padding: '0 8px',
            borderRadius: 20, fontSize: 11, fontWeight: 700,
            background: p.bg, color: '#fff',
          }}>{p.n}</span>
        ))}
      </div>
    )
  }

  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-title">Kundenliste</div>
          <div className="page-sub">{filtered.length} von {list.length} Kontakten</div>
        </div>
        <button className="btn btn-primary" style={{ marginLeft: 'auto' }}
          onClick={() => setShowNew(true)}>
          + Neuer Kunde
        </button>
      </div>

      {/* Filter-Leiste */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12, flexWrap: 'wrap' }}>
        <input
          type="search"
          className="form-input"
          placeholder="Name, E-Mail oder Ort…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ maxWidth: 260, flex: '0 0 auto' }}
        />
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600 }}>Quelle:</span>
          {KONTAKTQUELLEN.map(k => {
            const active = filterKq.includes(k)
            const c = TAG_COLORS[k] || TAG_COLORS.Sonstiges
            return (
              <button key={k} type="button" onClick={() => toggleFilter(k)} style={{
                padding: '3px 10px', borderRadius: 20, fontSize: 12, cursor: 'pointer',
                border: active ? `2px solid ${c.color}` : `1px solid ${c.border}`,
                background: active ? c.bg : 'var(--white)',
                color: active ? c.color : 'var(--muted)',
                fontWeight: active ? 700 : 400,
              }}>{k}</button>
            )
          })}
          {filterKq.length > 0 && (
            <button type="button" onClick={() => setFilterKq([])}
              style={{ fontSize: 11, color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer', padding: '0 4px' }}>
              ✕ zurücksetzen
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {filtered.length === 0 ? (
          <div className="empty-state">
            <div className="big">👥</div>
            {search || filterKq.length > 0 ? 'Keine Kunden gefunden.' : 'Noch keine Kunden. Leg den ersten an!'}
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th onClick={() => toggleSort('nachname')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                  Name{sortIcon('nachname')}
                </th>
                <th>Kontakt</th>
                <th>Quelle</th>
                <th onClick={() => toggleSort('berater')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                  Berater{sortIcon('berater')}
                </th>
                <th>Kategorien</th>
                <th onClick={() => toggleSort('folgetermin')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                  Folgetermin{sortIcon('folgetermin')}
                </th>
              </tr>
            </thead>
            <tbody>
              {sorted.map(c => {
                const kq = Array.isArray(c.kontaktquelle) ? c.kontaktquelle : []
                return (
                  <tr key={c.id} onClick={() => navigate(`/kunden/${c.id}`)}>
                    <td>
                      <div style={{ fontWeight: 700 }}>{c.p1_nachname} {c.p1_vorname}</div>
                      {c.p2_vorname && (
                        <div style={{ fontSize: 11, color: 'var(--muted)' }}>+ {c.p2_nachname} {c.p2_vorname}</div>
                      )}
                    </td>
                    <td>
                      <div>{c.p1_email}</div>
                      <div style={{ fontSize: 11, color: 'var(--muted)' }}>{c.p1_handy}</div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {kq.length > 0
                          ? kq.map(tag => <KontaktTag key={tag} label={tag} small />)
                          : <span style={{ color: 'var(--muted)', fontSize: 12 }}>—</span>}
                      </div>
                    </td>
                    <td style={{ color: 'var(--muted)', fontSize: 12 }}>{c.berater || '—'}</td>
                    <td>{statusBadge(c.besprochen, c.offen, c.kein_interesse)}</td>
                    <td style={{ fontSize: 12 }}>
                      {c.folgetermin_datum
                        ? new Date(c.folgetermin_datum).toLocaleDateString('de-DE')
                        : <span style={{ color: 'var(--muted)' }}>—</span>}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* New customer modal */}
      {showNew && (
        <div className="modal-overlay" onClick={() => setShowNew(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 560 }}>
            <div className="modal-header">
              <span className="modal-title">Neuer Kunde</span>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowNew(false)}>✕</button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="modal-body">
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.06em' }}>Person 1</div>
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Vorname *</label>
                    <input required className="form-input" value={form.p1_vorname}
                      onChange={e => setForm(f => ({ ...f, p1_vorname: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Nachname *</label>
                    <input required className="form-input" value={form.p1_nachname}
                      onChange={e => setForm(f => ({ ...f, p1_nachname: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">E-Mail</label>
                    <input type="email" className="form-input" value={form.p1_email}
                      onChange={e => setForm(f => ({ ...f, p1_email: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Handy</label>
                    <input className="form-input" value={form.p1_handy}
                      onChange={e => setForm(f => ({ ...f, p1_handy: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Ort</label>
                    <input className="form-input" value={form.p1_ort}
                      onChange={e => setForm(f => ({ ...f, p1_ort: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Beruf</label>
                    <input className="form-input" value={form.p1_beruf}
                      onChange={e => setForm(f => ({ ...f, p1_beruf: e.target.value }))} />
                  </div>
                </div>

                <div className="divider" />
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.06em' }}>Person hinzufügen</div>
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Vorname</label>
                    <input className="form-input" value={form.p2_vorname}
                      onChange={e => setForm(f => ({ ...f, p2_vorname: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Nachname</label>
                    <input className="form-input" value={form.p2_nachname}
                      onChange={e => setForm(f => ({ ...f, p2_nachname: e.target.value }))} />
                  </div>
                </div>

                <div className="divider" />
                <div className="form-group">
                  <label className="form-label">Berater</label>
                  <select className="form-select" value={form.berater}
                    onChange={e => setForm(f => ({ ...f, berater: e.target.value }))}>
                    <option value="">— auswählen —</option>
                    {BERATER.map(b => <option key={b}>{b}</option>)}
                  </select>
                </div>

                <div className="divider" />
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8 }}>Kontaktquelle</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                  {KONTAKTQUELLEN.map(k => {
                    const active = form.kontaktquelle.includes(k)
                    const c = TAG_COLORS[k] || TAG_COLORS.Sonstiges
                    return (
                      <button key={k} type="button" onClick={() => toggleKq(k)} style={{
                        padding: '5px 12px', borderRadius: 20, fontSize: 13, cursor: 'pointer',
                        border: active ? `2px solid ${c.color}` : '1px solid var(--line)',
                        background: active ? c.bg : 'var(--white)',
                        color: active ? c.color : 'var(--text)',
                        fontWeight: active ? 700 : 400,
                      }}>{k}</button>
                    )
                  })}
                </div>
                {form.kontaktquelle.includes('Sonstiges') && (
                  <input className="form-input" placeholder="Bitte beschreiben…"
                    value={form.kontaktquelle_sonstiges}
                    onChange={e => setForm(f => ({ ...f, kontaktquelle_sonstiges: e.target.value }))} />
                )}

                <div className="divider" />
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8 }}>
                  Interessensbereich <span style={{ fontWeight: 400, textTransform: 'none', fontSize: 11 }}>(optional)</span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {Object.entries(KATEGORIE_META).map(([key, meta]) => {
                    const selected = form.anfrage_kategorien.includes(key)
                    return (
                      <button key={key} type="button" onClick={() => toggleAnfrage(key)} style={{
                        display: 'flex', alignItems: 'center', gap: 5,
                        padding: '4px 10px', borderRadius: 20, fontSize: 12, cursor: 'pointer',
                        border: selected ? '2px solid var(--accent)' : '1px solid var(--line)',
                        background: selected ? 'var(--accent-light)' : 'var(--white)',
                        color: selected ? 'var(--accent)' : 'var(--text)',
                        fontWeight: selected ? 700 : 400,
                      }}>
                        <span>{meta.icon}</span> {meta.short}
                      </button>
                    )
                  })}
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowNew(false)}>Abbrechen</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Wird gespeichert…' : 'Anlegen'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
