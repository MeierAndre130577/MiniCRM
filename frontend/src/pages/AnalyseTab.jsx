import { useState } from 'react'
import { customers } from '../lib/api'

const KATEGORIE_META = {
  alter:            { icon: '🧓', label: 'Alter' },
  vermoegen:        { icon: '📈', label: 'Vermögen' },
  einkommensschutz: { icon: '🛡️', label: 'EK-Schutz' },
  gesundheit:       { icon: '🏥', label: 'Gesundheit' },
  wohnwuensche:     { icon: '🏠', label: 'Wohnen' },
  todesfall:        { icon: '⚰️', label: 'Todesfall' },
  haftpflicht:      { icon: '⚖️', label: 'Haftpflicht' },
  hausrat:          { icon: '🛋️', label: 'Hausrat' },
  gebaeude:         { icon: '🏗️', label: 'Gebäude' },
  rechtsschutz:     { icon: '📜', label: 'Rechtsschutz' },
  unfall:           { icon: '🚑', label: 'Unfall' },
  tier:             { icon: '🐕', label: 'Tier' },
  kfz:              { icon: '🚗', label: 'KFZ' },
  kindervorsorge:   { icon: '👶', label: 'Kinder' },
  immobilien:       { icon: '🏢', label: 'Immobilien' },
}

const GESPRAECH_STATUS = [
  { value: 'nicht_besprochen', label: 'Nicht besprochen', bg: 'var(--section-bg)',   color: 'var(--muted)',         border: 'var(--line)' },
  { value: 'offen',            label: 'Offen',            bg: 'var(--status-td-bg)', color: 'var(--status-td-c)',   border: 'var(--status-td-b)' },
  { value: 'besprochen',       label: 'Besprochen',       bg: 'var(--status-fu-bg)', color: 'var(--status-fu-c)',   border: 'var(--status-fu-b)' },
  { value: 'kein_interesse',   label: 'Kein Interesse',   bg: 'var(--status-ov-bg)', color: 'var(--status-ov-c)',   border: 'var(--status-ov-b)' },
]

const REC_STATUS = [
  { value: 'offen',        label: 'Offen',       bg: 'var(--section-bg)',   color: 'var(--muted)' },
  { value: 'praesentiert', label: 'Präsentiert', bg: 'var(--status-td-bg)', color: 'var(--status-td-c)' },
  { value: 'angenommen',   label: 'Angenommen',  bg: 'var(--status-fu-bg)', color: 'var(--status-fu-c)' },
  { value: 'abgelehnt',    label: 'Abgelehnt',   bg: 'var(--status-ov-bg)', color: 'var(--status-ov-c)' },
]

const EMPTY_FORM = { bezeichnung: '', gesellschaft: '', beitrag: '', leistung: '', begruendung: '', status: 'offen' }

function fmtEuro(v) {
  if (v == null || v === '') return null
  return Number(v).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'
}

function recStatusStyle(s) {
  return REC_STATUS.find(r => r.value === s) || REC_STATUS[0]
}

function gespraechStyle(s) {
  return GESPRAECH_STATUS.find(g => g.value === s) || GESPRAECH_STATUS[0]
}

function hasDaten(c) {
  return !!(c?.gesellschaft || c?.police_nr || c?.beitrag_alt || c?.beitrag_neu)
}

export default function AnalyseTab({ cats, contracts, recommendations, setRecommendations, customerId, onCatUpdated }) {
  const [editState, setEditState] = useState(null) // { cat, recId } — null=closed
  const [form, setForm]           = useState(EMPTY_FORM)
  const [saving, setSaving]       = useState(false)
  const [expanded, setExpanded]   = useState({})

  function toggleExpand(key) {
    setExpanded(p => ({ ...p, [key]: !p[key] }))
  }

  function isExpanded(key) {
    // auto-expand if has data
    if (expanded[key] !== undefined) return expanded[key]
    const hasCat = (cats[key] || {}).status !== 'nicht_besprochen'
    const hasContracts = (contracts[key] || []).filter(hasDaten).length > 0
    const hasRecs = (recommendations[key] || []).length > 0
    return hasCat || hasContracts || hasRecs
  }

  async function updateGespraechStatus(cat, status) {
    try {
      await customers.updateCategory(customerId, cat, {
        status,
        notizen: (cats[cat] || {}).notizen || '',
      })
      onCatUpdated()
    } catch (e) { alert(e.message) }
  }

  async function updateNotizen(cat, notizen) {
    try {
      await customers.updateCategory(customerId, cat, {
        status: (cats[cat] || {}).status || 'nicht_besprochen',
        notizen,
      })
      onCatUpdated()
    } catch (e) {}
  }

  function openNew(cat) {
    setForm(EMPTY_FORM)
    setEditState({ cat, recId: null })
  }

  function openEdit(cat, r) {
    setForm({
      bezeichnung:  r.bezeichnung  || '',
      gesellschaft: r.gesellschaft || '',
      beitrag:      r.beitrag      ?? '',
      leistung:     r.leistung     || '',
      begruendung:  r.begruendung  || '',
      status:       r.status       || 'offen',
    })
    setEditState({ cat, recId: r.id })
  }

  async function handleSave() {
    setSaving(true)
    try {
      const payload = {
        ...form,
        beitrag: form.beitrag !== '' ? Number(form.beitrag) : null,
      }
      const { cat, recId } = editState
      if (recId === null) {
        const created = await customers.createRecommendation(customerId, cat, payload)
        setRecommendations(p => ({ ...p, [cat]: [...(p[cat] || []), created] }))
      } else {
        const updated = await customers.updateRecommendation(customerId, recId, payload)
        setRecommendations(p => ({
          ...p,
          [cat]: p[cat].map(r => r.id === recId ? updated : r),
        }))
      }
      setEditState(null)
    } catch (e) { alert(e.message) }
    finally { setSaving(false) }
  }

  async function handleDeleteRec(cat, recId) {
    if (!confirm('Empfehlung löschen?')) return
    try {
      await customers.deleteRecommendation(customerId, recId)
      setRecommendations(p => ({ ...p, [cat]: p[cat].filter(r => r.id !== recId) }))
    } catch (e) { alert(e.message) }
  }

  async function updateRecStatus(cat, recId, status) {
    const rec = (recommendations[cat] || []).find(r => r.id === recId)
    if (!rec) return
    try {
      const updated = await customers.updateRecommendation(customerId, recId, { ...rec, status })
      setRecommendations(p => ({
        ...p,
        [cat]: p[cat].map(r => r.id === recId ? updated : r),
      }))
    } catch (e) { alert(e.message) }
  }

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {Object.entries(KATEGORIE_META).map(([key, m]) => {
          const catData    = cats[key] || {}
          const gStatus    = catData.status || 'nicht_besprochen'
          const gStyle     = gespraechStyle(gStatus)
          const bestand    = (contracts[key] || []).filter(hasDaten)
          const recs       = recommendations[key] || []
          const open       = isExpanded(key)

          // Delta: Summe Bestand beitrag_alt vs. jede Option
          const bestandTotal = bestand.reduce((s, c) => s + (Number(c.beitrag_alt) || 0), 0)

          return (
            <div key={key} style={{
              background: 'var(--white)',
              border: `1px solid ${gStyle.border}`,
              borderLeft: `3px solid ${gStyle.border}`,
              borderRadius: 10,
            }}>
              {/* ── Header ── */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 14px', cursor: 'pointer',
              }} onClick={() => toggleExpand(key)}>
                <span style={{ fontSize: 18 }}>{m.icon}</span>
                <span style={{ fontWeight: 700, fontSize: 14, flex: 1 }}>{m.label}</span>

                {/* Gesprächsstatus Pills */}
                <div style={{ display: 'flex', gap: 4 }} onClick={e => e.stopPropagation()}>
                  {GESPRAECH_STATUS.map(gs => (
                    <button key={gs.value} type="button"
                      onClick={() => updateGespraechStatus(key, gs.value)}
                      style={{
                        fontSize: 11, padding: '3px 9px', borderRadius: 20, cursor: 'pointer',
                        border: `1px solid ${gs.border}`,
                        background: gStatus === gs.value ? gs.bg : 'transparent',
                        color: gStatus === gs.value ? gs.color : 'var(--muted)',
                        fontWeight: gStatus === gs.value ? 700 : 400,
                      }}>
                      {gs.label}
                    </button>
                  ))}
                </div>

                {/* Kennzahlen */}
                {bestand.length > 0 && (
                  <span style={{ fontSize: 11, color: 'var(--muted)', marginLeft: 4 }}>
                    {bestand.length} Bestand
                  </span>
                )}
                {recs.length > 0 && (
                  <span style={{ fontSize: 11, color: 'var(--accent)', marginLeft: 4 }}>
                    {recs.filter(r => r.status === 'angenommen').length}/{recs.length} angenommen
                  </span>
                )}

                <span style={{ fontSize: 11, color: 'var(--muted)', marginLeft: 6 }}>{open ? '▲' : '▼'}</span>
              </div>

              {/* ── Body ── */}
              {open && (
                <div style={{ padding: '0 14px 14px', borderTop: '1px solid var(--line)' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 12 }}>

                    {/* ── Bestand ── */}
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--muted)', marginBottom: 8 }}>
                        Bestandsverträge
                        {bestandTotal > 0 && <span style={{ marginLeft: 8, fontWeight: 400 }}>{fmtEuro(bestandTotal)}/Mo gesamt</span>}
                      </div>
                      {bestand.length === 0 && (
                        <div style={{ fontSize: 12, color: 'var(--muted)', fontStyle: 'italic' }}>Kein Bestand erfasst</div>
                      )}
                      {bestand.map(c => (
                        <div key={c.id} style={{
                          background: 'var(--section-bg)', borderRadius: 7,
                          padding: '7px 10px', marginBottom: 6, fontSize: 12,
                        }}>
                          {c.gesellschaft && <div style={{ fontWeight: 700 }}>{c.gesellschaft}</div>}
                          {c.police_nr    && <div style={{ color: 'var(--muted)' }}>Police: {c.police_nr}</div>}
                          {fmtEuro(c.beitrag_alt) && <div style={{ marginTop: 2 }}>{fmtEuro(c.beitrag_alt)}/Mo</div>}
                        </div>
                      ))}
                    </div>

                    {/* ── Empfehlungen ── */}
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--muted)', marginBottom: 8 }}>
                        Empfehlungen
                      </div>
                      {recs.length === 0 && (
                        <div style={{ fontSize: 12, color: 'var(--muted)', fontStyle: 'italic' }}>Noch keine Empfehlung</div>
                      )}
                      {recs.map(r => {
                        const rs = recStatusStyle(r.status)
                        const delta = bestandTotal > 0 && r.beitrag != null
                          ? bestandTotal - r.beitrag
                          : null
                        return (
                          <div key={r.id} style={{
                            background: rs.bg, borderRadius: 7,
                            padding: '7px 10px', marginBottom: 6, fontSize: 12,
                            border: `1px solid var(--line)`,
                          }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                              <div style={{ flex: 1 }}>
                                {r.bezeichnung && <div style={{ fontWeight: 700, marginBottom: 2 }}>{r.bezeichnung}</div>}
                                {r.gesellschaft && <div>{r.gesellschaft}</div>}
                                {r.beitrag != null && (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
                                    <span style={{ fontWeight: 600 }}>{fmtEuro(r.beitrag)}/Mo</span>
                                    {delta !== null && (
                                      <span style={{
                                        fontSize: 11, fontWeight: 700,
                                        color: delta > 0 ? 'var(--status-fu-c)' : 'var(--status-ov-c)',
                                      }}>
                                        {delta > 0 ? '−' : '+'}{fmtEuro(Math.abs(delta))}/Mo
                                      </span>
                                    )}
                                  </div>
                                )}
                                {r.leistung    && <div style={{ color: 'var(--muted)', marginTop: 2 }}>{r.leistung}</div>}
                                {r.begruendung && <div style={{ color: 'var(--muted)', marginTop: 2, fontStyle: 'italic' }}>{r.begruendung}</div>}
                              </div>
                              <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                                <button type="button" onClick={() => openEdit(key, r)}
                                  style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--muted)', fontSize: 12 }}>✏</button>
                                <button type="button" onClick={() => handleDeleteRec(key, r.id)}
                                  style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--red)', fontSize: 12 }}>✕</button>
                              </div>
                            </div>
                            {/* Status-Wechsel */}
                            <div style={{ display: 'flex', gap: 4, marginTop: 8, flexWrap: 'wrap' }}>
                              {REC_STATUS.map(rs2 => (
                                <button key={rs2.value} type="button"
                                  onClick={() => updateRecStatus(key, r.id, rs2.value)}
                                  style={{
                                    fontSize: 10, padding: '2px 7px', borderRadius: 20, cursor: 'pointer',
                                    border: '1px solid var(--line)',
                                    background: r.status === rs2.value ? rs2.bg : 'transparent',
                                    color: r.status === rs2.value ? rs2.color : 'var(--muted)',
                                    fontWeight: r.status === rs2.value ? 700 : 400,
                                  }}>
                                  {rs2.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        )
                      })}
                      <button type="button" onClick={() => openNew(key)}
                        style={{
                          width: '100%', padding: '5px 0', marginTop: 2,
                          border: '1px dashed var(--line)', borderRadius: 7,
                          background: 'transparent', cursor: 'pointer',
                          fontSize: 11, color: 'var(--muted)',
                        }}>
                        + Empfehlung hinzufügen
                      </button>
                    </div>
                  </div>

                  {/* Notizen */}
                  <div style={{ marginTop: 10 }}>
                    <div style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--muted)', marginBottom: 4 }}>Notizen</div>
                    <textarea
                      className="form-textarea"
                      rows={2}
                      defaultValue={catData.notizen || ''}
                      onBlur={e => updateNotizen(key, e.target.value)}
                      placeholder="Besonderheiten, Wünsche, Hinweise…"
                      style={{ fontSize: 12 }}
                    />
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* ── Modal ── */}
      {editState && (
        <div className="modal-overlay" onClick={() => setEditState(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">
                {KATEGORIE_META[editState.cat]?.icon} {KATEGORIE_META[editState.cat]?.label} —{' '}
                {editState.recId ? 'Empfehlung bearbeiten' : 'Neue Empfehlung'}
              </span>
              <button className="btn btn-ghost btn-sm" onClick={() => setEditState(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Bezeichnung</label>
                  <input className="form-input" value={form.bezeichnung}
                    onChange={e => setForm(f => ({ ...f, bezeichnung: e.target.value }))}
                    placeholder='z.B. "Option A – Basis"' />
                </div>
                <div className="form-group">
                  <label className="form-label">Gesellschaft</label>
                  <input className="form-input" value={form.gesellschaft}
                    onChange={e => setForm(f => ({ ...f, gesellschaft: e.target.value }))}
                    placeholder="z.B. Allianz" />
                </div>
                <div className="form-group">
                  <label className="form-label">Beitrag (€/Monat)</label>
                  <input className="form-input" type="number" step="0.01" min="0"
                    value={form.beitrag}
                    onChange={e => setForm(f => ({ ...f, beitrag: e.target.value }))}
                    placeholder="0,00" />
                </div>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select className="form-select" value={form.status}
                    onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                    {REC_STATUS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Leistung / Absicherung</label>
                <input className="form-input" value={form.leistung}
                  onChange={e => setForm(f => ({ ...f, leistung: e.target.value }))}
                  placeholder="z.B. 150.000 € Todesfallschutz, BU bis 65" />
              </div>
              <div className="form-group">
                <label className="form-label">Begründung</label>
                <textarea className="form-textarea" rows={3} value={form.begruendung}
                  onChange={e => setForm(f => ({ ...f, begruendung: e.target.value }))}
                  placeholder="Warum diese Empfehlung? Was wird besser?" />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-ghost" onClick={() => setEditState(null)}>Abbrechen</button>
              <button type="button" className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Speichert…' : 'Speichern'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
