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
}

function hasDaten(c) {
  return !!(c?.gesellschaft || c?.police_nr || c?.beitrag_alt)
}

function fmtEuro(val) {
  if (val == null || val === '') return null
  return `${Number(val).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`
}

export default function VertraegeTab({ contracts, setContracts, customerId }) {
  const [editState, setEditState] = useState(null)
  const [form, setForm]           = useState(EMPTY_FORM)
  const [saving, setSaving]       = useState(false)

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
        beitrag_alt:     form.beitrag_alt !== '' ? Number(form.beitrag_alt) : null,
        absicherung_alt: form.absicherung_alt,
      }
      const { cat, contractId } = editState
      if (contractId === null) {
        const created = await customers.createContract(customerId, cat, payload)
        setContracts(prev => ({ ...prev, [cat]: [...(prev[cat] || []), created] }))
      } else {
        const updated = await customers.updateContract(customerId, contractId, payload)
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
      setContracts(prev => ({ ...prev, [cat]: prev[cat].filter(c => c.id !== contractId) }))
    } catch (e) {
      alert(e.message)
    }
  }

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
        {Object.entries(KATEGORIE_META).map(([key, m]) => {
          const list   = (contracts[key] || []).filter(hasDaten)
          const count  = list.length
          return (
            <div key={key} style={{
              background: 'var(--white)',
              border: count > 0 ? '1px solid var(--green)' : '1px dashed var(--line)',
              borderLeft: count > 0 ? '3px solid var(--green)' : '3px dashed var(--line)',
              borderRadius: 10, padding: '10px 12px',
            }}>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <span style={{ fontSize: 16 }}>{m.icon}</span>
                <span style={{ fontWeight: 700, fontSize: 13, flex: 1 }}>{m.label}</span>
                {count > 0 && (
                  <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--green)',
                    background: 'var(--status-fu-bg)', padding: '1px 6px', borderRadius: 10 }}>
                    {count}
                  </span>
                )}
              </div>

              {/* Bestehende Verträge */}
              {list.map(c => (
                <div key={c.id} style={{
                  fontSize: 11, background: 'var(--section-bg)', borderRadius: 6,
                  padding: '5px 8px', marginBottom: 5,
                  display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {c.gesellschaft || c.police_nr || '(kein Name)'}
                    </div>
                    {fmtEuro(c.beitrag_alt) && (
                      <div style={{ color: 'var(--muted)', fontSize: 10 }}>{fmtEuro(c.beitrag_alt)}/Monat</div>
                    )}
                  </div>
                  <button type="button" onClick={() => openEdit(key, c)}
                    style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--muted)', fontSize: 12, padding: 2 }}>✏</button>
                  <button type="button" onClick={() => handleDelete(key, c.id)}
                    style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--red)', fontSize: 12, padding: 2 }}>✕</button>
                </div>
              ))}

              {/* + Button */}
              <button type="button" onClick={() => openNew(key)}
                style={{
                  width: '100%', padding: '4px 0', marginTop: 2,
                  border: '1px dashed var(--line)', borderRadius: 6,
                  background: 'transparent', cursor: 'pointer',
                  fontSize: 11, color: 'var(--muted)',
                }}>
                + Vertrag hinzufügen
              </button>
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
                {meta.icon} {meta.label} — {editState.contractId ? 'Bearbeiten' : 'Neuer Vertrag'}
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
              <div style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--muted)', marginBottom: 10 }}>Bestandsvertrag</div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Beitrag alt (€/Monat)</label>
                  <input className="form-input" type="number" step="0.01" min="0"
                    value={form.beitrag_alt}
                    onChange={e => setForm(f => ({ ...f, beitrag_alt: e.target.value }))} placeholder="0,00" />
                </div>
                <div className="form-group">
                  <label className="form-label">Absicherung alt</label>
                  <input className="form-input" value={form.absicherung_alt}
                    onChange={e => setForm(f => ({ ...f, absicherung_alt: e.target.value }))} />
                </div>
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
