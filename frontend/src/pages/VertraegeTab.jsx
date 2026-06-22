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

const EMPTY_FORM = {
  gesellschaft: '', police_nr: '', ablaufdatum: '',
  beitrag_alt: '', absicherung_alt: '',
  beitrag_neu: '', absicherung_neu: '',
}

function fmtEuro(val) {
  if (val == null || val === '') return null
  return `${Number(val).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`
}

export default function VertraegeTab({ contracts, setContracts, customerId }) {
  const [editState, setEditState] = useState(null) // { cat, contractId } — null = closed
  const [form, setForm]           = useState(EMPTY_FORM)
  const [saving, setSaving]       = useState(false)

  const totalFilled = Object.values(contracts).reduce((n, list) => n + (list?.length || 0), 0)
  const meta = editState ? KATEGORIE_META[editState.cat] : null

  function openNew(cat) {
    setForm(EMPTY_FORM)
    setEditState({ cat, contractId: null })
  }

  function openEdit(cat, c) {
    setForm({
      gesellschaft:    c.gesellschaft    || '',
      police_nr:       c.police_nr       || '',
      ablaufdatum:     c.ablaufdatum     || '',
      beitrag_alt:     c.beitrag_alt     ?? '',
      absicherung_alt: c.absicherung_alt || '',
      beitrag_neu:     c.beitrag_neu     ?? '',
      absicherung_neu: c.absicherung_neu || '',
    })
    setEditState({ cat, contractId: c.id })
  }

  async function handleSave() {
    setSaving(true)
    try {
      const payload = {
        gesellschaft:    form.gesellschaft,
        police_nr:       form.police_nr,
        ablaufdatum:     form.ablaufdatum,
        beitrag_alt:     form.beitrag_alt     !== '' ? Number(form.beitrag_alt)     : null,
        absicherung_alt: form.absicherung_alt,
        beitrag_neu:     form.beitrag_neu     !== '' ? Number(form.beitrag_neu)     : null,
        absicherung_neu: form.absicherung_neu,
      }
      const { cat, contractId } = editState
      let updated
      if (contractId === null) {
        updated = await customers.createContract(customerId, cat, payload)
        setContracts(prev => ({ ...prev, [cat]: [...(prev[cat] || []), updated] }))
      } else {
        updated = await customers.updateContract(customerId, contractId, payload)
        setContracts(prev => ({
          ...prev,
          [cat]: prev[cat].map(c => c.id === contractId ? updated : c),
        }))
      }
      setEditState(null)
    } catch (e) {
      alert(e.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(cat, contractId) {
    if (!confirm('Vertrag löschen?')) return
    try {
      await customers.deleteContract(customerId, contractId)
      setContracts(prev => ({
        ...prev,
        [cat]: prev[cat].filter(c => c.id !== contractId),
      }))
    } catch (e) {
      alert(e.message)
    }
  }

  return (
    <>
      <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 13, color: 'var(--muted)' }}>
          {totalFilled} Vertrag{totalFilled !== 1 ? 'verträge' : ''} erfasst
        </span>
        {totalFilled > 0 && (
          <span className="badge badge-green">{totalFilled} erfasst</span>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {Object.entries(KATEGORIE_META).map(([key, m]) => {
          const list = contracts[key] || []
          const has  = list.length > 0
          return (
            <div key={key} style={{
              background: 'var(--white)',
              border: has ? '1px solid var(--green)' : '1px dashed var(--line)',
              borderLeft: has ? '3px solid var(--green)' : '3px dashed var(--line)',
              borderRadius: 10,
              padding: '10px 14px',
            }}>
              {/* Kategorie-Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: has ? 8 : 0 }}>
                <span style={{ fontSize: 18 }}>{m.icon}</span>
                <span style={{ fontWeight: 700, fontSize: 13 }}>{m.label}</span>
                {has && (
                  <span style={{ marginLeft: 4, fontSize: 11, color: 'var(--green)', fontWeight: 600 }}>
                    {list.length} Vertrag{list.length > 1 ? 'verträge' : ''}
                  </span>
                )}
                <button type="button" onClick={() => openNew(key)}
                  style={{
                    marginLeft: 'auto', fontSize: 11, padding: '3px 10px',
                    border: '1px solid var(--line)', borderRadius: 6,
                    background: 'transparent', cursor: 'pointer', color: 'var(--muted)',
                  }}>
                  + Vertrag
                </button>
              </div>

              {/* Vertrags-Liste */}
              {has && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {list.map((c, i) => (
                    <div key={c.id} style={{
                      background: 'var(--section-bg)', borderRadius: 7,
                      padding: '8px 12px', fontSize: 12,
                      display: 'flex', alignItems: 'flex-start', gap: 10,
                    }}>
                      <div style={{ flex: 1 }}>
                        {c.gesellschaft && <div style={{ fontWeight: 700, marginBottom: 2 }}>{c.gesellschaft}</div>}
                        {c.police_nr    && <div style={{ color: 'var(--muted)' }}>Police: {c.police_nr}</div>}
                        <div style={{ display: 'flex', gap: 12, marginTop: 3, flexWrap: 'wrap' }}>
                          {fmtEuro(c.beitrag_alt) && (
                            <span style={{ color: 'var(--muted)' }}>Alt: {fmtEuro(c.beitrag_alt)}</span>
                          )}
                          {fmtEuro(c.beitrag_neu) && (
                            <span style={{ color: 'var(--green)', fontWeight: 600 }}>Neu: {fmtEuro(c.beitrag_neu)}</span>
                          )}
                          {c.ablaufdatum && (
                            <span style={{ color: 'var(--muted)' }}>Ablauf: {new Date(c.ablaufdatum).toLocaleDateString('de-DE')}</span>
                          )}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                        <button type="button" onClick={() => openEdit(key, c)}
                          style={{ fontSize: 11, padding: '2px 8px', border: '1px solid var(--line)', borderRadius: 5, background: 'transparent', cursor: 'pointer', color: 'var(--muted)' }}>
                          ✏
                        </button>
                        <button type="button" onClick={() => handleDelete(key, c.id)}
                          style={{ fontSize: 11, padding: '2px 8px', border: '1px solid var(--line)', borderRadius: 5, background: 'transparent', cursor: 'pointer', color: 'var(--red)' }}>
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {!has && (
                <div style={{ fontSize: 11, color: 'var(--muted)' }}>Noch kein Vertrag erfasst</div>
              )}
            </div>
          )
        })}
      </div>

      {/* Modal */}
      {editState && (
        <div className="modal-overlay" onClick={() => setEditState(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">
                {meta.icon} {meta.label} — {editState.contractId ? 'Vertrag bearbeiten' : 'Neuer Vertrag'}
              </span>
              <button className="btn btn-ghost btn-sm" onClick={() => setEditState(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Versicherungsgesellschaft</label>
                  <input className="form-input" value={form.gesellschaft}
                    onChange={e => setForm(f => ({ ...f, gesellschaft: e.target.value }))}
                    placeholder="z.B. Allianz" />
                </div>
                <div className="form-group">
                  <label className="form-label">Police-Nr.</label>
                  <input className="form-input" value={form.police_nr}
                    onChange={e => setForm(f => ({ ...f, police_nr: e.target.value }))}
                    placeholder="z.B. 12345678" />
                </div>
                <div className="form-group">
                  <label className="form-label">Ablaufdatum</label>
                  <input className="form-input" type="date" value={form.ablaufdatum}
                    onChange={e => setForm(f => ({ ...f, ablaufdatum: e.target.value }))} />
                </div>
              </div>

              <div className="divider" />
              <div style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--muted)', marginBottom: 10 }}>
                Bestandsvertrag
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Beitrag alt (€/Monat)</label>
                  <input className="form-input" type="number" step="0.01" min="0"
                    value={form.beitrag_alt}
                    onChange={e => setForm(f => ({ ...f, beitrag_alt: e.target.value }))}
                    placeholder="0,00" />
                </div>
                <div className="form-group">
                  <label className="form-label">Absicherung alt</label>
                  <input className="form-input" value={form.absicherung_alt}
                    onChange={e => setForm(f => ({ ...f, absicherung_alt: e.target.value }))}
                    placeholder="z.B. 100.000 € Todesfallschutz" />
                </div>
              </div>

              <div className="divider" />
              <div style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--muted)', marginBottom: 10 }}>
                Neuer Vertrag
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Beitrag neu (€/Monat)</label>
                  <input className="form-input" type="number" step="0.01" min="0"
                    value={form.beitrag_neu}
                    onChange={e => setForm(f => ({ ...f, beitrag_neu: e.target.value }))}
                    placeholder="0,00" />
                </div>
                <div className="form-group">
                  <label className="form-label">Absicherung neu</label>
                  <input className="form-input" value={form.absicherung_neu}
                    onChange={e => setForm(f => ({ ...f, absicherung_neu: e.target.value }))}
                    placeholder="z.B. 150.000 € Todesfallschutz" />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-ghost" onClick={() => setEditState(null)}>
                Abbrechen
              </button>
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
