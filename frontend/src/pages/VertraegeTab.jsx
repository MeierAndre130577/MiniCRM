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

const EMPTY = {
  gesellschaft: '', police_nr: '', ablaufdatum: '',
  beitrag_alt: '', absicherung_alt: '',
  beitrag_neu: '', absicherung_neu: '',
}

function hasDaten(c) {
  return !!(c?.gesellschaft || c?.police_nr || c?.beitrag_alt || c?.beitrag_neu)
}

function fmtEuro(val) {
  if (val == null || val === '') return null
  return `${Number(val).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`
}

export default function VertraegeTab({ contracts, setContracts, customerId }) {
  const [editCat, setEditCat] = useState(null)
  const [form, setForm]       = useState(EMPTY)
  const [saving, setSaving]   = useState(false)

  function openEdit(catKey) {
    const c = contracts[catKey] || {}
    setForm({
      gesellschaft:    c.gesellschaft    || '',
      police_nr:       c.police_nr       || '',
      ablaufdatum:     c.ablaufdatum     || '',
      beitrag_alt:     c.beitrag_alt     ?? '',
      absicherung_alt: c.absicherung_alt || '',
      beitrag_neu:     c.beitrag_neu     ?? '',
      absicherung_neu: c.absicherung_neu || '',
    })
    setEditCat(catKey)
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
        beitrag_neu:     form.beitrag_neu !== '' ? Number(form.beitrag_neu) : null,
        absicherung_neu: form.absicherung_neu,
      }
      const updated = await customers.upsertContract(customerId, editCat, payload)
      setContracts(prev => ({ ...prev, [editCat]: updated }))
      setEditCat(null)
    } catch (e) {
      alert(e.message)
    } finally {
      setSaving(false)
    }
  }

  const filledCount = Object.keys(KATEGORIE_META).filter(k => hasDaten(contracts[k])).length
  const meta = editCat ? KATEGORIE_META[editCat] : null

  return (
    <>
      <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 13, color: 'var(--muted)' }}>
          {filledCount} von {Object.keys(KATEGORIE_META).length} Kategorien erfasst
        </span>
        {filledCount > 0 && (
          <span className="badge badge-green">{filledCount} erfasst</span>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
        {Object.entries(KATEGORIE_META).map(([key, m]) => {
          const c   = contracts[key]
          const has = hasDaten(c)
          return (
            <div
              key={key}
              onClick={() => openEdit(key)}
              style={{
                background: 'var(--white)',
                border: has ? '1px solid var(--green)' : '1px dashed var(--line)',
                borderLeft: has ? '3px solid var(--green)' : '3px dashed var(--line)',
                borderRadius: 10,
                padding: '12px 14px',
                cursor: 'pointer',
                transition: 'box-shadow .15s',
              }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = 'var(--shadow)'}
              onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: has ? 8 : 4 }}>
                <span style={{ fontSize: 18 }}>{m.icon}</span>
                <span style={{ fontWeight: 700, fontSize: 13 }}>{m.label}</span>
                {has && (
                  <span style={{ marginLeft: 'auto', width: 8, height: 8, borderRadius: '50%', background: 'var(--green)', flexShrink: 0 }} />
                )}
              </div>
              {has ? (
                <div style={{ fontSize: 12 }}>
                  {c.gesellschaft && <div style={{ fontWeight: 600, marginBottom: 2 }}>{c.gesellschaft}</div>}
                  {c.police_nr    && <div style={{ color: 'var(--muted)' }}>Police: {c.police_nr}</div>}
                  <div style={{ display: 'flex', gap: 10, marginTop: 4, flexWrap: 'wrap' }}>
                    {fmtEuro(c.beitrag_alt) && (
                      <span style={{ color: 'var(--muted)' }}>Alt: {fmtEuro(c.beitrag_alt)}</span>
                    )}
                    {fmtEuro(c.beitrag_neu) && (
                      <span style={{ color: 'var(--green)', fontWeight: 600 }}>Neu: {fmtEuro(c.beitrag_neu)}</span>
                    )}
                  </div>
                </div>
              ) : (
                <div style={{ fontSize: 11, color: 'var(--muted)' }}>+ Vertrag erfassen</div>
              )}
            </div>
          )
        })}
      </div>

      {editCat && (
        <div className="modal-overlay" onClick={() => setEditCat(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">{meta.icon} {meta.label} — Vertrag</span>
              <button className="btn btn-ghost btn-sm" onClick={() => setEditCat(null)}>✕</button>
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
              <button type="button" className="btn btn-ghost" onClick={() => setEditCat(null)}>
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
