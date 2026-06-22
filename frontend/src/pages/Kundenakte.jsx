import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { customers } from '../lib/api'

const KONTAKTQUELLEN = ['Dummy', 'Lead', 'Empfehlung', 'Bestandskunde', 'Sonstiges']

const TAG_COLORS = {
  Dummy:        { bg: '#f3f4f6', color: '#6b7280', border: '#d1d5db' },
  Lead:         { bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe' },
  Empfehlung:   { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' },
  Bestandskunde:{ bg: '#fef9c3', color: '#a16207', border: '#fde68a' },
  Sonstiges:    { bg: '#fdf4ff', color: '#9333ea', border: '#e9d5ff' },
}

const EMPTY_CONTRACT = {
  gesellschaft: '', police_nr: '', ablaufdatum: '',
  beitrag_alt: '', absicherung_alt: '',
  beitrag_neu: '', absicherung_neu: '',
}

const BERATER = ['Thomas Schmidt', 'Tatjana Schmidt', 'Markus Maurer', 'Silvia Dürst']

const KATEGORIE_META = {
  alter:            { icon: '🧓', short: 'Alter',        label: 'Sorglos im Alter',  sub: 'Wunschrente, Endalter, Risikoneigung' },
  vermoegen:        { icon: '📈', short: 'Vermögen',     label: 'Vermögen aufbauen', sub: 'Ziele, Depot, Tagesgeld, Anlageart' },
  einkommensschutz: { icon: '🛡️', short: 'EK-Schutz',   label: 'Einkommensschutz',  sub: 'BU/GU, DD, Höhe, Endalter' },
  gesundheit:       { icon: '🏥', short: 'Gesundheit',   label: 'Gesundheit',        sub: 'Pflege, Facharzt, Zahn, Stationär' },
  wohnwuensche:     { icon: '🏠', short: 'Wohnen',       label: 'Wohnwünsche',       sub: 'Eigenheim, Bausparen, Baufinanzierung' },
  todesfall:        { icon: '⚰️', short: 'Todesfall',    label: 'Todesfall',         sub: 'Risikoleben, Sterbegeld, Wunschkapital' },
  haftpflicht:      { icon: '⚖️', short: 'Haftpflicht',  label: 'Haftpflicht',       sub: 'Privat, Amt, Vermietung' },
  hausrat:          { icon: '🛋️', short: 'Hausrat',      label: 'Hausrat',           sub: 'EFH/MFH, ELE, Glas, Wertsachen' },
  gebaeude:         { icon: '🏗️', short: 'Gebäude',      label: 'Gebäude',           sub: 'Gebäudetyp, Deckungen, PV, Wärmepumpe' },
  rechtsschutz:     { icon: '📜', short: 'Rechtsschutz', label: 'Rechtsschutz',      sub: 'Privat, Beruf, Wohnen, Verkehr' },
  unfall:           { icon: '🚑', short: 'Unfall',        label: 'Unfall',            sub: '4 Personen, Unfallrente, Schutzbrief' },
  tier:             { icon: '🐕', short: 'Tier',          label: 'Tier',              sub: 'Haft, Kranken, Heilbehandlung' },
  kfz:              { icon: '🚗', short: 'KFZ',           label: 'KFZ',               sub: 'SF, Fahrerschutz, GAP, Werkstattplus' },
  kindervorsorge:   { icon: '👶', short: 'Kinder',        label: 'Kindervorsorge',    sub: 'AV, Bausparen, BU, Zahn je Kind' },
  immobilien:       { icon: '🏢', short: 'Immobilien',    label: 'Immobilien',        sub: 'Art, Ort, Kauf/Verkauf/Vermietung' },
}

const STATUS_OPTIONS = [
  { value: 'nicht_besprochen', label: 'Nicht besprochen', cls: 'badge-gray' },
  { value: 'offen',            label: 'Offen',            cls: 'badge-orange' },
  { value: 'besprochen',       label: 'Besprochen',       cls: 'badge-green' },
  { value: 'kein_interesse',   label: 'Kein Interesse',   cls: 'badge-red' },
]

const AP_BEREICHE = [
  { key: 'absicherung',   label: 'Absicherung' },
  { key: 'person',        label: 'Personenversicherung' },
  { key: 'geldanlage',    label: 'Geldanlage' },
  { key: 'finanzierung',  label: 'Finanzierung / Bausparen' },
  { key: 'immobilien',    label: 'Immobilien' },
]

function statusCls(s) {
  if (s === 'besprochen')     return 'badge-green'
  if (s === 'offen')          return 'badge-orange'
  if (s === 'kein_interesse') return 'badge-red'
  return 'badge-gray'
}

function statusColors(s) {
  if (s === 'besprochen')     return { border: 'var(--green)',  bg: 'var(--green-bg)' }
  if (s === 'offen')          return { border: 'var(--orange)', bg: 'var(--orange-bg)' }
  if (s === 'kein_interesse') return { border: 'var(--red)',    bg: 'var(--red-light)' }
  return { border: 'var(--line)', bg: 'var(--bg)' }
}

function Field({ label, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div className="form-label">{label}</div>
      {children}
    </div>
  )
}

export default function Kundenakte() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const tab = searchParams.get('tab') || 'uebersicht'
  const [kunde, setKunde]           = useState(null)
  const [saving, setSaving]         = useState(false)
  const [katModal, setKatModal]     = useState(null)
  const [apptForm, setApptForm]     = useState({ datum: '', status: '', notizen: '' })
  const [showAppt, setShowAppt]     = useState(false)
  const [contracts, setContracts]   = useState({})
  const [tvStatus, setTvStatus]         = useState([])
  const [leadMapping, setLeadMapping]   = useState({})

  const load = useCallback(async () => {
    try { setKunde(await customers.get(Number(id))) } catch { navigate('/kunden') }
  }, [id, navigate])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    customers.getContracts(Number(id))
      .then(map => setContracts(map || {}))
      .catch(() => {})
  }, [id])

  useEffect(() => {
    import('../lib/api').then(({ settings }) => {
      settings.get('terminverlauf_status')
        .then(r => { if (Array.isArray(r.value)) setTvStatus(r.value) })
        .catch(() => {})
      settings.get('lead_produkt_mapping')
        .then(r => {
          if (Array.isArray(r.value)) {
            const map = {}
            r.value.forEach(e => { map[e.produkt.toLowerCase()] = e.kategorie })
            setLeadMapping(map)
          }
        })
        .catch(() => {})
    })
  }, [])

  async function saveField(field, value) {
    setSaving(true)
    try {
      const updated = await customers.update(Number(id), { ...toForm(kunde), [field]: value })
      setKunde(updated)
    } catch (e) { alert(e.message) }
    finally { setSaving(false) }
  }

  async function saveAll(patch) {
    setSaving(true)
    try {
      const updated = await customers.update(Number(id), { ...toForm(kunde), ...patch })
      setKunde(updated)
    } catch (e) { alert(e.message) }
    finally { setSaving(false) }
  }

  async function saveKat() {
    try {
      await customers.updateCategory(Number(id), katModal.key,
        { status: katModal.status, notizen: katModal.notizen })
      await load()
      setKatModal(null)
    } catch (e) { alert(e.message) }
  }

  async function addAppt(e) {
    e.preventDefault()
    try {
      await customers.addAppointment(Number(id), apptForm)
      setApptForm({ datum: '', status: '', notizen: '' })
      setShowAppt(false)
      await load()
    } catch (e) { alert(e.message) }
  }

  async function delAppt(apptId) {
    if (!confirm('Termin löschen?')) return
    await customers.deleteAppointment(Number(id), apptId)
    await load()
  }

  async function deleteKunde() {
    if (!confirm(`Kunde "${kunde.p1_vorname} ${kunde.p1_nachname}" wirklich löschen?`)) return
    await customers.delete(Number(id))
    navigate('/kunden')
  }

  if (!kunde) return <div style={{ padding: 40, color: 'var(--muted)' }}>Lade…</div>

  const cats            = kunde.categories || {}

  // Lead-Produkt live aus notizen ableiten falls anfrage_kategorien leer
  const storedKats = kunde.anfrage_kategorien || []
  const leadProduktMatch = (kunde.notizen || '').match(/Produkt:\s*(.+?)(\s*\||$)/)
  const leadKatFromMapping = leadProduktMatch
    ? leadMapping[(leadProduktMatch[1].trim()).toLowerCase()]
    : null
  const anfragKats = leadKatFromMapping && !storedKats.includes(leadKatFromMapping)
    ? [...storedKats, leadKatFromMapping]
    : storedKats
  const besprochen      = Object.values(cats).filter(c => c.status === 'besprochen').length
  const offen           = Object.values(cats).filter(c => c.status === 'offen').length
  const keinInteresse   = Object.values(cats).filter(c => c.status === 'kein_interesse').length
  const apScores        = kunde.ap_scores || {}

  return (
    <>
      {/* Header */}
      <div className="page-header">
        <button className="btn btn-ghost btn-sm" onClick={() => navigate('/kunden')}>← Zurück</button>
        <div>
          <div className="page-title">{kunde.p1_vorname} {kunde.p1_nachname}</div>
          <div className="page-sub">
            {kunde.p1_ort && `${kunde.p1_ort} · `}
            {kunde.berater || 'Kein Berater'}
            {saving && <span style={{ marginLeft: 10, color: 'var(--muted)', fontSize: 12 }}>Speichert…</span>}
          </div>
        </div>
        <button className="btn btn-danger btn-sm" style={{ marginLeft: 'auto' }}
          onClick={deleteKunde}>Löschen</button>
      </div>

      {/* ── Übersicht ── */}
      {tab === 'uebersicht' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* Excel-Export */}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <a
              href={customers.exportExcelUrl(Number(id))}
              download
              className="btn btn-primary btn-sm"
              style={{ textDecoration: 'none' }}
            >
              Excel-Analyse herunterladen
            </a>
          </div>

          {/* KPI Chips */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {[
              { label: 'Besprochen', value: `${besprochen} / 15`, cls: 'badge-green' },
              { label: 'Offen', value: offen, cls: 'badge-orange' },
              { label: 'Kein Interesse', value: keinInteresse, cls: 'badge-red' },
              { label: 'Folgetermin', value: kunde.folgetermin_datum ? new Date(kunde.folgetermin_datum).toLocaleDateString('de-DE') : '—', cls: 'badge-blue' },
              { label: 'Budget frei', value: kunde.hhr_freier_betrag ? `${kunde.hhr_freier_betrag} €` : '—', cls: 'badge-gray' },
            ].map(k => (
              <div key={k.label} style={{ display: 'flex', alignItems: 'center', gap: 6,
                background: 'var(--white)', border: '1px solid var(--line)', borderRadius: 8,
                padding: '6px 12px', fontSize: 13 }}>
                <span style={{ color: 'var(--muted)' }}>{k.label}:</span>
                <span className={`badge ${k.cls}`}>{k.value}</span>
              </div>
            ))}
          </div>

          {/* Kategorien kompakt */}
          <div className="card" style={{ padding: '12px 14px' }}>
            <div className="section-label" style={{ marginBottom: 10 }}>Kategorien</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6 }}>
              {Object.entries(KATEGORIE_META).map(([key, meta]) => {
                const s = (cats[key] || {}).status || 'nicht_besprochen'
                const { border, bg } = statusColors(s)
                const isAnfrage = anfragKats.includes(key)
                return (
                  <div key={key} onClick={() => navigate(`/kunden/${id}?tab=kategorien`)} style={{
                    position: 'relative',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                    padding: '8px 4px', borderRadius: 8, cursor: 'pointer',
                    border: `1px solid ${border}`, background: bg,
                    transition: 'opacity .15s',
                  }}>
                    {isAnfrage && (
                      <span style={{
                        position: 'absolute', top: -6, right: -6,
                        fontSize: 16, color: '#2563eb', lineHeight: 1,
                        background: 'white', borderRadius: '50%',
                        width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
                      }} title="Anfrage-Interesse">ℹ</span>
                    )}
                    <span style={{ fontSize: 18 }}>{meta.icon}</span>
                    <span style={{ fontSize: 10, fontWeight: 600, textAlign: 'center', color: 'var(--text)', lineHeight: 1.3 }}>
                      {meta.label}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Kontakt + Berater kompakt */}
          <div className="card" style={{ padding: '12px 14px' }}>
            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
              {[
                { label: 'E-Mail', value: kunde.p1_email },
                { label: 'Handy', value: kunde.p1_handy },
                { label: 'Beruf', value: kunde.p1_beruf },
                { label: 'Berater', value: kunde.berater },
                { label: 'Notizen', value: kunde.notizen },
              ].filter(f => f.value).map(f => (
                <div key={f.label} style={{ fontSize: 12 }}>
                  <span style={{ color: 'var(--muted)' }}>{f.label}: </span>
                  <span style={{ fontWeight: 600 }}>{f.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Stammdaten ── */}
      {tab === 'stammdaten' && (
        <StammdatenTab kunde={kunde} saveAll={saveAll} />
      )}

      {/* ── Kategorien ── */}
      {tab === 'kategorien' && (
        <KategorienSwipe cats={cats} anfragKats={anfragKats} contracts={contracts} setContracts={setContracts} customerId={Number(id)} onSaved={load} />
      )}

      {/* ── Ansprechpartner Scores ── */}
      {tab === 'ansprechpartner' && (
        <ApScoresTab apScores={apScores} saveAll={saveAll} kunde={kunde} />
      )}

      {/* ── Budget ── */}
      {tab === 'budget' && (
        <BudgetTab kunde={kunde} saveAll={saveAll} />
      )}

      {/* ── Termine ── */}
      {tab === 'termine' && (
        <TermineTab
          kunde={kunde}
          saveAll={saveAll}
          tvStatus={tvStatus}
          showAppt={showAppt} setShowAppt={setShowAppt}
          apptForm={apptForm} setApptForm={setApptForm}
          addAppt={addAppt} delAppt={delAppt}
        />
      )}

      {/* ── Notizen ── */}
      {tab === 'notizen' && (
        <NotizTab kunde={kunde} saveAll={saveAll} />
      )}

      {/* Kategorie Modal */}
      {katModal && (
        <div className="modal-overlay" onClick={() => setKatModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">
                {KATEGORIE_META[katModal.key]?.icon} {KATEGORIE_META[katModal.key]?.label}
              </span>
              <button className="btn btn-ghost btn-sm" onClick={() => setKatModal(null)}>✕</button>
            </div>
            <div className="modal-body">
              <Field label="Status">
                <select className="form-select" value={katModal.status}
                  onChange={e => setKatModal(m => ({ ...m, status: e.target.value }))}>
                  {STATUS_OPTIONS.map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </Field>
              <Field label="Notizen">
                <textarea className="form-textarea" rows={4} value={katModal.notizen}
                  onChange={e => setKatModal(m => ({ ...m, notizen: e.target.value }))}
                  placeholder="Besonderheiten, bestehende Verträge, Wünsche…" />
              </Field>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setKatModal(null)}>Abbrechen</button>
              <button className="btn btn-primary" onClick={saveKat}>Speichern</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// ── Stammdaten Tab ─────────────────────────────────────────────────────────────
function StammdatenTab({ kunde, saveAll }) {
  const [form, setForm] = useState(toForm(kunde))
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  async function handleSave(e) {
    e.preventDefault()
    await saveAll(form)
  }

  const ABSCHLUSS = ['kein Abschluss', 'Schulabschluss', 'abgeschl. Berufsausbildung', 'staatl. anerkannte Berufsweiterbildung', 'Hochschulabschluss']
  const ARBEITSVERH = ['Privatwirtschaft', 'Öffentlicher Dienst', 'Angehörige der Versicherungsbranche', 'Angehörige KFZ-Gewerbe']
  const GKV_STAND = ['Arbeitnehmer/in', 'Freiwillig versicherte/r Arbeitnehmer/in', 'Auszubildende/r', 'Student/in', 'Rentner/in', 'Elternzeit', 'Selbstständige/r']
  const FAMILIENSTAND = ['ledig', 'verheiratet', 'geschieden', 'verwitwet', 'Lebenspartnerschaft']

  function SectionLabel({ children }) {
    return (
      <div style={{
        fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em',
        color: 'var(--muted)', borderBottom: '1px solid var(--line)',
        paddingBottom: 6, marginBottom: 12, marginTop: 4,
      }}>{children}</div>
    )
  }

  function PersonForm({ prefix, title, defaultOpen = true }) {
    const [open, setOpen] = useState(defaultOpen)
    const g = (k) => form[`${prefix}_${k}`]
    const s = (k) => (e) => set(`${prefix}_${k}`, e.target.value)
    const sNum = (k) => (e) => set(`${prefix}_${k}`, e.target.value ? Number(e.target.value) : null)
    return (
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div onClick={() => setOpen(o => !o)} style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 20px', cursor: 'pointer', userSelect: 'none',
          borderBottom: open ? '1px solid var(--line)' : 'none',
          background: 'var(--bg)',
        }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{title}</span>
          <span style={{ fontSize: 12, color: 'var(--muted)', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }}>▼</span>
        </div>

        {open && (
          <div style={{ padding: '20px 20px 8px' }}>

            {/* Identität */}
            <SectionLabel>Identität</SectionLabel>
            <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr 1fr', gap: '10px 16px', marginBottom: 20 }}>
              <Field label="Anrede">
                <select className="form-select" value={g('anrede') || ''} onChange={s('anrede')}>
                  <option value="">—</option>
                  <option>Herr</option><option>Frau</option>
                </select>
              </Field>
              <Field label="Vorname">
                <input className="form-input" value={g('vorname') || ''} onChange={s('vorname')} />
              </Field>
              <Field label="Nachname">
                <input className="form-input" value={g('nachname') || ''} onChange={s('nachname')} />
              </Field>
              <Field label="Geburtsdatum">
                <input type="date" className="form-input" value={g('geburtsdatum') || ''} onChange={s('geburtsdatum')} />
              </Field>
              <Field label="Familienstand">
                <select className="form-select" value={g('familienstand') || ''} onChange={s('familienstand')}>
                  <option value="">—</option>
                  {FAMILIENSTAND.map(f => <option key={f}>{f}</option>)}
                </select>
              </Field>
              <Field label="Raucher">
                <select className="form-select" value={g('raucher') ?? 0}
                  onChange={e => set(`${prefix}_raucher`, Number(e.target.value))}>
                  <option value={0}>Nein</option><option value={1}>Ja</option>
                </select>
              </Field>
            </div>

            {/* Kontakt */}
            <SectionLabel>Kontakt</SectionLabel>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px 16px', marginBottom: 20 }}>
              <Field label="E-Mail">
                <input type="email" className="form-input" value={g('email') || ''} onChange={s('email')} />
              </Field>
              <Field label="Handy">
                <input className="form-input" value={g('handy') || ''} onChange={s('handy')} />
              </Field>
              <Field label="Festnetz">
                <input className="form-input" value={g('festnetz') || ''} onChange={s('festnetz')} />
              </Field>
            </div>

            {/* Adresse */}
            <SectionLabel>Adresse</SectionLabel>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 100px 1fr', gap: '10px 16px', marginBottom: 20 }}>
              <Field label="Straße & Nr.">
                <input className="form-input" value={g('strasse') || ''} onChange={s('strasse')} />
              </Field>
              <Field label="PLZ">
                <input className="form-input" value={g('plz') || ''} onChange={s('plz')} />
              </Field>
              <Field label="Ort">
                <input className="form-input" value={g('ort') || ''} onChange={s('ort')} />
              </Field>
            </div>

            {/* Beruf & Einkommen */}
            <SectionLabel>Beruf & Einkommen</SectionLabel>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px 16px', marginBottom: 20 }}>
              <Field label="Beruf">
                <input className="form-input" value={g('beruf') || ''} onChange={s('beruf')} />
              </Field>
              <Field label="Höchster Abschluss">
                <select className="form-select" value={g('abschluss') || ''} onChange={s('abschluss')}>
                  <option value="">—</option>
                  {ABSCHLUSS.map(a => <option key={a}>{a}</option>)}
                </select>
              </Field>
              <Field label="Arbeitsverhältnis">
                <select className="form-select" value={g('arbeitsverhaeltnis') || ''} onChange={s('arbeitsverhaeltnis')}>
                  <option value="">—</option>
                  {ARBEITSVERH.map(a => <option key={a}>{a}</option>)}
                </select>
              </Field>
              <Field label="Arbeitgeber">
                <input className="form-input" value={g('arbeitgeber') || ''} onChange={s('arbeitgeber')} />
              </Field>
              <Field label="Gehalt netto (€)">
                <input type="number" className="form-input" value={g('gehalt_netto') || ''} onChange={sNum('gehalt_netto')} />
              </Field>
              <Field label="Gehalt brutto (€)">
                <input type="number" className="form-input" value={g('gehalt_brutto') || ''} onChange={sNum('gehalt_brutto')} />
              </Field>
              <Field label="GKV-Anbieter">
                <input className="form-input" value={g('gkv_anbieter') || ''} onChange={s('gkv_anbieter')} />
              </Field>
              <Field label="GKV-Stand">
                <select className="form-select" value={g('gkv_stand') || ''} onChange={s('gkv_stand')}>
                  <option value="">—</option>
                  {GKV_STAND.map(x => <option key={x}>{x}</option>)}
                </select>
              </Field>
              <Field label="IBAN">
                <input className="form-input" value={g('iban') || ''} onChange={s('iban')} />
              </Field>
            </div>

            {/* Persönliches */}
            <SectionLabel>Persönliches</SectionLabel>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 16px', marginBottom: 16 }}>
              <Field label="Hobby">
                <input className="form-input" value={g('hobby') || ''} onChange={s('hobby')} />
              </Field>
              <Field label="Haustiere">
                <input className="form-input" value={g('haustiere') || ''} onChange={s('haustiere')} />
              </Field>
            </div>

          </div>
        )}
      </div>
    )
  }

  const p1Title = [form.p1_vorname, form.p1_nachname].filter(Boolean).join(' ') || 'Person 1'
  const hasP2Data = !!(form.p2_vorname || form.p2_nachname || form.p2_email || form.p2_handy)
  const [showP2, setShowP2] = useState(hasP2Data)
  const p2Title = [form.p2_vorname, form.p2_nachname].filter(Boolean).join(' ') || 'Person 2'

  return (
    <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* ── Agenturdaten ── */}
      <div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8,
        }}>
          <span style={{
            fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em',
            color: '#fff', background: '#1d4ed8', padding: '3px 10px', borderRadius: 20,
          }}>Agenturdaten</span>
          <span style={{ fontSize: 11, color: 'var(--muted)' }}>Intern — wird von der Agentur gepflegt</span>
        </div>
        <div className="card" style={{ padding: '14px 16px', borderLeft: '3px solid #1d4ed8' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-start' }}>
            <div style={{ minWidth: 200 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.06em' }}>Berater</div>
              <select className="form-select" value={form.berater || ''}
                onChange={e => set('berater', e.target.value)}>
                <option value="">— auswählen —</option>
                {BERATER.map(b => <option key={b}>{b}</option>)}
              </select>
            </div>
            <div style={{ flex: 1, minWidth: 240 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.06em' }}>Kontaktquelle</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>
                {KONTAKTQUELLEN.map(k => {
                  const kqArr = Array.isArray(form.kontaktquelle) ? form.kontaktquelle : []
                  const active = kqArr.includes(k)
                  const c = TAG_COLORS[k] || TAG_COLORS.Sonstiges
                  return (
                    <button key={k} type="button"
                      onClick={() => set('kontaktquelle', active ? kqArr.filter(x => x !== k) : [...kqArr, k])}
                      style={{
                        padding: '4px 12px', borderRadius: 20, fontSize: 12, cursor: 'pointer',
                        border: active ? `2px solid ${c.color}` : '1px solid var(--line)',
                        background: active ? c.bg : 'var(--white)',
                        color: active ? c.color : 'var(--text)',
                        fontWeight: active ? 700 : 400,
                      }}>
                      {k}
                    </button>
                  )
                })}
              </div>
              {(Array.isArray(form.kontaktquelle) ? form.kontaktquelle : []).includes('Sonstiges') && (
                <input className="form-input" placeholder="Bitte beschreiben…"
                  value={form.kontaktquelle_sonstiges || ''}
                  onChange={e => set('kontaktquelle_sonstiges', e.target.value)} />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Kundendaten ── */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <span style={{
            fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em',
            color: '#fff', background: '#16a34a', padding: '3px 10px', borderRadius: 20,
          }}>Kundendaten</span>
          <span style={{ fontSize: 11, color: 'var(--muted)' }}>Persönliche Angaben des Kunden</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <PersonForm prefix="p1" title={p1Title} defaultOpen={true} />
      {showP2
        ? <PersonForm prefix="p2" title={p2Title} defaultOpen={true} />
        : (
          <button type="button" onClick={() => setShowP2(true)} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600,
            border: '2px dashed var(--line)', background: 'transparent',
            color: 'var(--muted)', cursor: 'pointer', width: '100%',
          }}>
            <span style={{ fontSize: 16 }}>+</span> Person hinzufügen
          </button>
        )
      }
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button type="submit" className="btn btn-primary">Speichern</button>
      </div>
    </form>
  )
}

// ── Ansprechpartner Tab ────────────────────────────────────────────────────────
function ApScoresTab({ apScores, saveAll, kunde }) {
  const [scores, setScores] = useState(apScores)

  async function handleSave(e) {
    e.preventDefault()
    await saveAll({ ...toForm(kunde), ap_scores: scores })
  }

  return (
    <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="card">
        <div className="section-label" style={{ marginBottom: 16 }}>Bewertung je Bereich (0–10)</div>
        {AP_BEREICHE.map(b => (
          <div key={b.key} style={{ marginBottom: 20 }}>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8 }}>{b.label}</div>
            <div className="grid-3">
              <Field label="Wichtigkeit (0–10)">
                <input type="number" min={0} max={10} className="form-input"
                  value={scores[`${b.key}_wichtigkeit`] ?? ''}
                  onChange={e => setScores(s => ({ ...s, [`${b.key}_wichtigkeit`]: e.target.value === '' ? null : Number(e.target.value) }))} />
              </Field>
              <Field label="Ansprechpartner vorhanden">
                <select className="form-select"
                  value={scores[`${b.key}_vorhanden`] ?? ''}
                  onChange={e => setScores(s => ({ ...s, [`${b.key}_vorhanden`]: e.target.value }))}>
                  <option value="">—</option>
                  <option value="ja">Ja</option>
                  <option value="nein">Nein</option>
                </select>
              </Field>
              <Field label="Zufriedenheit (0–10)">
                <input type="number" min={0} max={10} className="form-input"
                  value={scores[`${b.key}_zufriedenheit`] ?? ''}
                  onChange={e => setScores(s => ({ ...s, [`${b.key}_zufriedenheit`]: e.target.value === '' ? null : Number(e.target.value) }))} />
              </Field>
            </div>
            <div className="divider" style={{ marginTop: 16 }} />
          </div>
        ))}

        <div className="grid-2">
          <Field label="Qualität der Absicherung">
            <select className="form-select"
              value={scores.qualitaet_absicherung || ''}
              onChange={e => setScores(s => ({ ...s, qualitaet_absicherung: e.target.value }))}>
              <option value="">—</option>
              <option>grobe Absicherung</option>
              <option>sehr gut abgesichert</option>
              <option>max. Absicherung</option>
            </select>
          </Field>
          <Field label="Höhe der Selbstbeteiligung">
            <select className="form-select"
              value={scores.selbstbeteiligung || ''}
              onChange={e => setScores(s => ({ ...s, selbstbeteiligung: e.target.value }))}>
              <option value="">—</option>
              <option>keine (außer RS)</option>
              <option>150 €</option>
              <option>250 €</option>
              <option>500 €</option>
              <option>1.000 €</option>
            </select>
          </Field>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button type="submit" className="btn btn-primary">Speichern</button>
      </div>
    </form>
  )
}

// ── Budget Tab ────────────────────────────────────────────────────────────────
function BudgetTab({ kunde, saveAll }) {
  const [form, setForm] = useState(toForm(kunde))
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  async function handleSave(e) {
    e.preventDefault()
    await saveAll(form)
  }

  const einnahmen = (Number(form.hhr_einnahmen_gehalt) || 0) +
    (Number(form.hhr_einnahmen_zuschuesse) || 0) +
    (Number(form.hhr_einnahmen_weitere) || 0)

  return (
    <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="card">
        <div className="section-label" style={{ marginBottom: 12 }}>Budget für Neuverträge</div>
        <div className="grid-2">
          <Field label="Absicherung monatlich (€)">
            <input type="number" className="form-input" value={form.budget_absicherung_monatlich || ''}
              onChange={e => set('budget_absicherung_monatlich', e.target.value ? Number(e.target.value) : null)} />
          </Field>
          <Field label="Absicherung einmalig (€)">
            <input type="number" className="form-input" value={form.budget_absicherung_einmalig || ''}
              onChange={e => set('budget_absicherung_einmalig', e.target.value ? Number(e.target.value) : null)} />
          </Field>
          <Field label="Ansparung monatlich (€)">
            <input type="number" className="form-input" value={form.budget_ansparung_monatlich || ''}
              onChange={e => set('budget_ansparung_monatlich', e.target.value ? Number(e.target.value) : null)} />
          </Field>
          <Field label="Ansparung einmalig (€)">
            <input type="number" className="form-input" value={form.budget_ansparung_einmalig || ''}
              onChange={e => set('budget_ansparung_einmalig', e.target.value ? Number(e.target.value) : null)} />
          </Field>
        </div>
        <div style={{ marginTop: 12 }}>
          <Field label="Notizen">
            <textarea className="form-textarea" value={form.budget_notizen || ''}
              onChange={e => set('budget_notizen', e.target.value)} />
          </Field>
        </div>
      </div>

      <div className="card">
        <div className="section-label" style={{ marginBottom: 12 }}>Haushaltsrechner</div>
        <div className="grid-3">
          <Field label="Gehalt gesamt (€)">
            <input type="number" className="form-input" value={form.hhr_einnahmen_gehalt || ''}
              onChange={e => set('hhr_einnahmen_gehalt', e.target.value ? Number(e.target.value) : null)} />
          </Field>
          <Field label="Staatliche Zuschüsse (€)">
            <input type="number" className="form-input" value={form.hhr_einnahmen_zuschuesse || ''}
              onChange={e => set('hhr_einnahmen_zuschuesse', e.target.value ? Number(e.target.value) : null)} />
          </Field>
          <Field label="Weitere Einnahmen (€)">
            <input type="number" className="form-input" value={form.hhr_einnahmen_weitere || ''}
              onChange={e => set('hhr_einnahmen_weitere', e.target.value ? Number(e.target.value) : null)} />
          </Field>
          <Field label="Ausgaben gesamt (€)">
            <input type="number" className="form-input" value={form.hhr_ausgaben_gesamt || ''}
              onChange={e => set('hhr_ausgaben_gesamt', e.target.value ? Number(e.target.value) : null)} />
          </Field>
          <Field label="Freier Betrag mtl. (€)">
            <input type="number" className="form-input"
              value={form.hhr_freier_betrag || (einnahmen && form.hhr_ausgaben_gesamt ? einnahmen - Number(form.hhr_ausgaben_gesamt) : '')}
              onChange={e => set('hhr_freier_betrag', e.target.value ? Number(e.target.value) : null)} />
          </Field>
        </div>
        <div style={{ marginTop: 12 }}>
          <Field label="Notizen">
            <textarea className="form-textarea" value={form.hhr_notizen || ''}
              onChange={e => set('hhr_notizen', e.target.value)} />
          </Field>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button type="submit" className="btn btn-primary">Speichern</button>
      </div>
    </form>
  )
}

// ── Termine Tab ────────────────────────────────────────────────────────────────
const TV_STATUS_COLORS = {
  'Neuer Lead':                 { bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe' },
  'Termin angefragt':           { bg: '#fef9c3', color: '#a16207', border: '#fde68a' },
  'Termin gebucht':             { bg: '#fdf4ff', color: '#9333ea', border: '#e9d5ff' },
  'Termin stattgefunden':       { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' },
  'Nachfassen / Angebot offen': { bg: '#fff7ed', color: '#ea580c', border: '#fed7aa' },
  'Bestandskunde':              { bg: '#f0fdf4', color: '#15803d', border: '#86efac' },
  'Verloren':                   { bg: '#fef2f2', color: '#dc2626', border: '#fecaca' },
}

function tvStatusStyle(s) {
  return TV_STATUS_COLORS[s] || { bg: '#f3f4f6', color: '#6b7280', border: '#d1d5db' }
}

function TermineTab({ kunde, saveAll, tvStatus, showAppt, setShowAppt, apptForm, setApptForm, addAppt, delAppt }) {
  const [showFolge, setShowFolge] = useState(false)
  const [folgeForm, setFolgeForm] = useState({
    datum: kunde.folgetermin_datum || '',
    notizen: kunde.folgetermin_notizen || '',
  })
  const [savingFolge, setSavingFolge] = useState(false)

  async function saveFolge() {
    setSavingFolge(true)
    try {
      await saveAll({ folgetermin_datum: folgeForm.datum, folgetermin_notizen: folgeForm.notizen })
      setShowFolge(false)
    } catch (e) { alert(e.message) }
    finally { setSavingFolge(false) }
  }

  const hasFolge = !!kunde.folgetermin_datum
  const appts    = kunde.appointments || []

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      <div className="card">
        {/* Header mit beiden Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: hasFolge || appts.length > 0 ? 20 : 0 }}>
          <div className="section-label" style={{ margin: 0 }}>Terminverlauf</div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <button type="button" className="btn btn-ghost btn-sm"
              onClick={() => { setFolgeForm({ datum: kunde.folgetermin_datum || '', notizen: kunde.folgetermin_notizen || '' }); setShowFolge(true) }}>
              {hasFolge ? '✏ Folgetermin' : '+ Folgetermin'}
            </button>
            <button type="button" className="btn btn-primary btn-sm"
              onClick={() => setShowAppt(true)}>
              + Eintrag
            </button>
          </div>
        </div>

        {/* Timeline */}
        {(hasFolge || appts.length > 0) && (
          <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', left: 10, top: 8, bottom: 8, width: 2, background: 'var(--line)', borderRadius: 2 }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>

              {/* Folgetermin — immer oben wenn gesetzt */}
              {hasFolge && (
                <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', paddingBottom: 22 }}>
                  <div style={{
                    width: 20, height: 20, borderRadius: '50%', flexShrink: 0, marginTop: 1,
                    background: '#2563eb', border: '3px solid var(--white)', zIndex: 1,
                    boxShadow: '0 0 0 2px #2563eb',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'white' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 800, fontSize: 14, color: '#2563eb' }}>
                        {new Date(kunde.folgetermin_datum).toLocaleDateString('de-DE')}
                      </span>
                      <span style={{
                        padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                        background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe',
                      }}>Folgetermin</span>
                    </div>
                    {kunde.folgetermin_notizen && (
                      <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 3 }}>
                        {kunde.folgetermin_notizen}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Trennlinie zwischen Zukunft und Vergangenheit */}
              {hasFolge && appts.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18, paddingLeft: 30 }}>
                  <div style={{ flex: 1, height: 1, background: 'var(--line)' }} />
                  <span style={{ fontSize: 10, color: 'var(--muted)', whiteSpace: 'nowrap', fontWeight: 600, letterSpacing: '.05em', textTransform: 'uppercase' }}>
                    Vergangene Einträge
                  </span>
                  <div style={{ flex: 1, height: 1, background: 'var(--line)' }} />
                </div>
              )}

              {/* Vergangene Einträge */}
              {appts.map(a => {
                const ss = tvStatusStyle(a.status)
                return (
                  <div key={a.id} style={{ display: 'flex', gap: 16, alignItems: 'flex-start', paddingBottom: 20 }}>
                    <div style={{
                      width: 20, height: 20, borderRadius: '50%', flexShrink: 0, marginTop: 1,
                      background: a.status ? ss.color : '#cbd5e1',
                      border: '2px solid var(--white)', zIndex: 1,
                      boxShadow: '0 0 0 2px ' + (a.status ? ss.color : '#cbd5e1'),
                    }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 700, fontSize: 13 }}>
                          {new Date(a.datum).toLocaleDateString('de-DE')}
                        </span>
                        {a.created_at && (
                          <span style={{ fontSize: 11, color: 'var(--muted)' }}>
                            {new Date(a.created_at).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} Uhr
                          </span>
                        )}
                        {a.status && (
                          <span style={{
                            padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                            background: ss.bg, color: ss.color, border: `1px solid ${ss.border}`,
                          }}>{a.status}</span>
                        )}
                        <button type="button" onClick={() => delAppt(a.id)}
                          style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: 14, padding: '0 2px', lineHeight: 1 }}>✕</button>
                      </div>
                      {a.notizen && (
                        <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 3 }}>{a.notizen}</div>
                      )}
                    </div>
                  </div>
                )
              })}

              {appts.length === 0 && !hasFolge && (
                <div style={{ paddingLeft: 30, color: 'var(--muted)', fontSize: 13 }}>Noch keine Einträge.</div>
              )}
            </div>
          </div>
        )}

        {!hasFolge && appts.length === 0 && (
          <div style={{ color: 'var(--muted)', fontSize: 13 }}>Noch keine Einträge.</div>
        )}
      </div>

      {/* Folgetermin Modal */}
      {showFolge && (
        <div className="modal-overlay" onClick={() => setShowFolge(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
            <div className="modal-header">
              <span className="modal-title">Folgetermin</span>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowFolge(false)}>✕</button>
            </div>
            <div className="modal-body">
              <Field label="Datum">
                <input type="date" className="form-input" value={folgeForm.datum}
                  onChange={e => setFolgeForm(f => ({ ...f, datum: e.target.value }))} />
              </Field>
              <Field label="Notizen">
                <input className="form-input" value={folgeForm.notizen}
                  onChange={e => setFolgeForm(f => ({ ...f, notizen: e.target.value }))}
                  placeholder="Thema, Ort, Anlass…" />
              </Field>
            </div>
            <div className="modal-footer">
              {hasFolge && (
                <button type="button" className="btn btn-ghost" style={{ color: 'var(--red)' }}
                  onClick={async () => { await saveAll({ folgetermin_datum: null, folgetermin_notizen: '' }); setShowFolge(false) }}>
                  Löschen
                </button>
              )}
              <button type="button" className="btn btn-ghost" onClick={() => setShowFolge(false)}>Abbrechen</button>
              <button type="button" className="btn btn-primary" disabled={savingFolge} onClick={saveFolge}>Speichern</button>
            </div>
          </div>
        </div>
      )}

      {/* Neuer Eintrag Modal */}
      {showAppt && (
        <div className="modal-overlay" onClick={() => setShowAppt(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 420 }}>
            <div className="modal-header">
              <span className="modal-title">Eintrag erfassen</span>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowAppt(false)}>✕</button>
            </div>
            <div className="modal-body">
              <Field label="Datum *">
                <input type="date" required className="form-input" value={apptForm.datum}
                  onChange={e => setApptForm(f => ({ ...f, datum: e.target.value }))} />
              </Field>
              <Field label="Status">
                <select className="form-select" value={apptForm.status}
                  onChange={e => setApptForm(f => ({ ...f, status: e.target.value }))}>
                  <option value="">— auswählen —</option>
                  {tvStatus.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </Field>
              <Field label="Notizen">
                <textarea className="form-textarea" value={apptForm.notizen}
                  onChange={e => setApptForm(f => ({ ...f, notizen: e.target.value }))}
                  placeholder="Was wurde besprochen?" />
              </Field>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-ghost" onClick={() => setShowAppt(false)}>Abbrechen</button>
              <button type="button" className="btn btn-primary" onClick={addAppt}>Hinzufügen</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Notizen Tab ────────────────────────────────────────────────────────────────
function NotizTab({ kunde, saveAll }) {
  const [form, setForm] = useState(toForm(kunde))
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  async function handleSave(e) {
    e.preventDefault()
    await saveAll(form)
  }

  return (
    <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Empfehlung & Bewertung */}
      <div className="card">
        <div className="section-label" style={{ marginBottom: 12 }}>Empfehlung & Bewertung</div>
        <div className="grid-3">
          <Field label="Google (Sterne 1–5)">
            <select className="form-select" value={form.bewertung_google || ''}
              onChange={e => set('bewertung_google', e.target.value ? Number(e.target.value) : null)}>
              <option value="">—</option>
              {[1,2,3,4,5].map(n => <option key={n} value={n}>{'★'.repeat(n)} ({n})</option>)}
            </select>
          </Field>
          <Field label="Trustpilot (1–5)">
            <select className="form-select" value={form.bewertung_trustpilot || ''}
              onChange={e => set('bewertung_trustpilot', e.target.value ? Number(e.target.value) : null)}>
              <option value="">—</option>
              {[1,2,3,4,5].map(n => <option key={n} value={n}>{'★'.repeat(n)} ({n})</option>)}
            </select>
          </Field>
          <Field label="Facebook (1–5)">
            <select className="form-select" value={form.bewertung_facebook || ''}
              onChange={e => set('bewertung_facebook', e.target.value ? Number(e.target.value) : null)}>
              <option value="">—</option>
              {[1,2,3,4,5].map(n => <option key={n} value={n}>{'★'.repeat(n)} ({n})</option>)}
            </select>
          </Field>
        </div>
        <div style={{ marginTop: 12 }}>
          <Field label="Empfehlungsnotizen">
            <textarea className="form-textarea" value={form.empfehlung_notizen || ''}
              onChange={e => set('empfehlung_notizen', e.target.value)}
              placeholder="Empfehlungen, positive Erfahrungen…" />
          </Field>
        </div>
      </div>

      {/* Schäden */}
      <div className="card">
        <div className="section-label" style={{ marginBottom: 12 }}>Schäden</div>
        <Field label="Notizen">
          <textarea className="form-textarea" rows={5} value={form.schaeden_notizen || ''}
            onChange={e => set('schaeden_notizen', e.target.value)}
            placeholder="Bekannte Schäden, Vorerkrankungen…" />
        </Field>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button type="submit" className="btn btn-primary">Speichern</button>
      </div>
    </form>
  )
}

// ── Kategorien Swipe View ─────────────────────────────────────────────────────
const KAT_KEYS = Object.keys(KATEGORIE_META)

function ContractSection({ title, fields, contract, setContract, accent }) {
  const [open, setOpen] = useState(false)
  const hasData = fields.some(f => contract[f.key] !== '' && contract[f.key] != null)
  return (
    <div style={{ marginTop: 12, border: `1px solid ${accent}30`, borderRadius: 8, overflow: 'hidden' }}>
      <div onClick={() => setOpen(o => !o)} style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 12px', cursor: 'pointer', background: `${accent}10`,
        userSelect: 'none',
      }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: accent, textTransform: 'uppercase', letterSpacing: '.06em' }}>
          {title}
          {hasData && <span style={{ marginLeft: 6, width: 6, height: 6, borderRadius: '50%', background: accent, display: 'inline-block' }} />}
        </span>
        <span style={{ fontSize: 11, color: accent, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }}>▼</span>
      </div>
      {open && (
        <div style={{ padding: '10px 12px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {fields.map(f => (
            <div key={f.key} style={{ display: 'flex', flexDirection: 'column', gap: 3, gridColumn: f.full ? '1 / -1' : undefined }}>
              <div className="form-label" style={{ fontSize: 10 }}>{f.label}</div>
              <input
                type={f.type || 'text'}
                className="form-input"
                style={{ fontSize: 13, padding: '5px 8px' }}
                value={contract[f.key] ?? ''}
                onChange={e => setContract(c => ({ ...c, [f.key]: e.target.value }))}
                placeholder={f.placeholder || ''}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function KategorienSwipe({ cats, anfragKats = [], contracts, setContracts, customerId, onSaved }) {
  const [index, setIndex]       = useState(0)
  const [direction, setDir]     = useState(null)
  const [animating, setAnim]    = useState(false)
  const [local, setLocal]       = useState({})
  const [localContract, setLocalContract] = useState(EMPTY_CONTRACT)
  const [saving, setSaving]     = useState(false)
  const [touchStart, setTouch]  = useState(null)

  const key  = KAT_KEYS[index]
  const meta = KATEGORIE_META[key]

  useEffect(() => {
    const cat = cats[key] || {}
    setLocal({ status: cat.status || 'nicht_besprochen', notizen: cat.notizen || '' })
    const c = contracts[key] || {}
    setLocalContract({
      gesellschaft:    c.gesellschaft    || '',
      police_nr:       c.police_nr       || '',
      ablaufdatum:     c.ablaufdatum     || '',
      beitrag_alt:     c.beitrag_alt     ?? '',
      absicherung_alt: c.absicherung_alt || '',
      beitrag_neu:     c.beitrag_neu     ?? '',
      absicherung_neu: c.absicherung_neu || '',
    })
  }, [index, key, cats, contracts])

  async function saveCurrentAndGo(nextIndex, dir) {
    if (animating) return
    setSaving(true)
    try {
      await customers.updateCategory(customerId, key, { status: local.status, notizen: local.notizen })
      const saved = await customers.upsertContract(customerId, key, {
        gesellschaft:    localContract.gesellschaft,
        police_nr:       localContract.police_nr,
        ablaufdatum:     localContract.ablaufdatum,
        beitrag_alt:     localContract.beitrag_alt !== '' ? Number(localContract.beitrag_alt) : null,
        absicherung_alt: localContract.absicherung_alt,
        beitrag_neu:     localContract.beitrag_neu !== '' ? Number(localContract.beitrag_neu) : null,
        absicherung_neu: localContract.absicherung_neu,
      })
      setContracts(prev => ({ ...prev, [key]: saved }))
      await onSaved()
    } catch (e) { console.error(e) }
    finally { setSaving(false) }

    setDir(dir)
    setAnim(true)
    setTimeout(() => {
      setIndex(nextIndex)
      setDir(null)
      setAnim(false)
    }, 220)
  }

  function goNext() { if (index < KAT_KEYS.length - 1) saveCurrentAndGo(index + 1, 'left') }
  function goPrev() { if (index > 0) saveCurrentAndGo(index - 1, 'right') }

  function onTouchStart(e) { setTouch(e.touches[0].clientX) }
  function onTouchEnd(e) {
    if (touchStart === null) return
    const dx = e.changedTouches[0].clientX - touchStart
    if (dx < -50) goNext()
    else if (dx > 50) goPrev()
    setTouch(null)
  }

  useEffect(() => {
    function onKey(e) {
      if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT') return
      if (e.key === 'ArrowRight') goNext()
      if (e.key === 'ArrowLeft')  goPrev()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const slideStyle = animating ? {
    transform: direction === 'left' ? 'translateX(-60px)' : 'translateX(60px)',
    opacity: 0,
    transition: 'transform .22s ease, opacity .22s ease',
  } : {
    transform: 'translateX(0)',
    opacity: 1,
    transition: 'transform .22s ease, opacity .22s ease',
  }

  const statusCounts = KAT_KEYS.reduce((acc, k) => {
    const s = (cats[k] || {}).status || 'nicht_besprochen'
    acc[s] = (acc[s] || 0) + 1
    return acc
  }, {})

  const ALT_FIELDS = [
    { key: 'gesellschaft',    label: 'Gesellschaft',    placeholder: 'z.B. Allianz' },
    { key: 'police_nr',       label: 'Policen-Nr.',     placeholder: '123456789' },
    { key: 'ablaufdatum',     label: 'Ablaufdatum',     type: 'date' },
    { key: 'beitrag_alt',     label: 'Beitrag alt (€/mtl.)', type: 'number', placeholder: '0.00' },
    { key: 'absicherung_alt', label: 'Absicherung alt', placeholder: 'Leistungen…', full: true },
  ]
  const NEU_FIELDS = [
    { key: 'beitrag_neu',     label: 'Beitrag neu (€/mtl.)', type: 'number', placeholder: '0.00' },
    { key: 'absicherung_neu', label: 'Absicherung neu', placeholder: 'Verbesserungen…', full: true },
  ]

  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      {/* Icon-Leiste scrollbar */}
      <div style={{ overflowX: 'auto', marginBottom: 16, paddingBottom: 4 }}>
        <div style={{ display: 'flex', gap: 6, minWidth: 'max-content', alignItems: 'flex-end' }}>
          {KAT_KEYS.map((k, i) => {
            const s   = (cats[k] || {}).status || 'nicht_besprochen'
            const isActive = i === index
            const sc = statusColors(s)
            const borderColor = isActive ? '#374151' : sc.border
            const bg  = sc.bg
            return (
              <div key={k}
                onClick={() => saveCurrentAndGo(i, i > index ? 'left' : 'right')}
                title={KATEGORIE_META[k].label}
                style={{
                  position: 'relative',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                  padding: isActive ? '12px 16px' : '6px 8px', borderRadius: 8, cursor: 'pointer',
                  border: `2px solid ${borderColor}`,
                  background: bg,
                  minWidth: isActive ? 90 : 64,
                  transition: 'all .15s',
                }}>
                {anfragKats.includes(k) && (
                  <span style={{
                    position: 'absolute', top: 2, right: 3,
                    fontSize: 10, color: '#2563eb', fontWeight: 700, lineHeight: 1,
                  }}>ℹ</span>
                )}
                <span style={{ fontSize: isActive ? 32 : 20 }}>{KATEGORIE_META[k].icon}</span>
                <span style={{ fontSize: 9, fontWeight: isActive ? 700 : 500,
                  color: 'var(--muted)', textAlign: 'center', lineHeight: 1.2, whiteSpace: 'nowrap' }}>
                  {KATEGORIE_META[k].short}
                </span>
                <div style={{ width: '100%', height: 3, borderRadius: 2,
                  background: s === 'nicht_besprochen' ? 'transparent' : sc.border }} />
              </div>
            )
          })}
        </div>
      </div>

      {/* Zähler + Chips */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <span style={{ fontSize: 13, color: 'var(--muted)' }}>{index + 1} / {KAT_KEYS.length}</span>
        <span className="badge badge-green">{statusCounts.besprochen || 0} besprochen</span>
        <span className="badge badge-orange">{statusCounts.offen || 0} offen</span>
        <span className="badge badge-gray">{statusCounts.nicht_besprochen || 0} neu</span>
        {(statusCounts.kein_interesse || 0) > 0 && (
          <span className="badge badge-red">{statusCounts.kein_interesse} kein Interesse</span>
        )}
        {saving && <span style={{ fontSize: 12, color: 'var(--muted)', marginLeft: 'auto' }}>Speichert…</span>}
      </div>

      {/* Karte */}
      <div onTouchStart={onTouchStart} onTouchEnd={onTouchEnd} style={slideStyle}>
        <div className="card" style={{ padding: '24px 24px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 20 }}>
            <span style={{ fontSize: 40 }}>{meta.icon}</span>
            <div>
              <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--dark)' }}>{meta.label}</div>
              <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>{meta.sub}</div>
            </div>
          </div>

          {/* Status */}
          <div style={{ marginBottom: 16 }}>
            <div className="form-label" style={{ marginBottom: 6 }}>Status</div>
            <div style={{ display: 'flex', gap: 8 }}>
              {STATUS_OPTIONS.map(opt => {
                const active = local.status === opt.value
                const sc = statusColors(opt.value)
                return (
                  <button key={opt.value} type="button"
                    onClick={() => setLocal(l => ({ ...l, status: opt.value }))}
                    style={{
                      flex: 1, padding: '8px 4px', borderRadius: 8, cursor: 'pointer',
                      border: active ? `2px solid ${sc.border}` : '1px solid var(--line)',
                      background: active ? sc.bg : 'var(--white)',
                      color: active ? sc.border : 'var(--muted)',
                      fontWeight: active ? 700 : 400,
                      fontSize: 12, transition: 'all .15s',
                    }}>
                    {opt.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Notizen */}
          <div style={{ marginBottom: 4 }}>
            <div className="form-label" style={{ marginBottom: 6 }}>Notizen</div>
            <textarea className="form-textarea" rows={3}
              value={local.notizen}
              onChange={e => setLocal(l => ({ ...l, notizen: e.target.value }))}
              placeholder="Bestehende Verträge, Wünsche, Besonderheiten…" />
          </div>

          {/* Vertragsfelder */}
          <ContractSection
            title="Vorvertrag (alt)"
            fields={ALT_FIELDS}
            contract={localContract}
            setContract={setLocalContract}
            accent="#2563eb"
          />
          <ContractSection
            title="Vorschlag (neu)"
            fields={NEU_FIELDS}
            contract={localContract}
            setContract={setLocalContract}
            accent="#16a34a"
          />
        </div>
      </div>

      {/* Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 20 }}>
        <button className="btn btn-ghost" onClick={goPrev} disabled={index === 0 || animating}>
          ← Zurück
        </button>
        <div style={{ display: 'flex', gap: 6 }}>
          {KAT_KEYS.map((k, i) => (
            <div key={k}
              onClick={() => saveCurrentAndGo(i, i > index ? 'left' : 'right')}
              style={{
                width: i === index ? 20 : 7, height: 7, borderRadius: 4,
                background: i === index ? 'var(--red)' : 'var(--line)',
                cursor: 'pointer', transition: 'all .2s',
              }} />
          ))}
        </div>
        <button className="btn btn-primary" onClick={goNext} disabled={index === KAT_KEYS.length - 1 || animating}>
          {index === KAT_KEYS.length - 1 ? 'Fertig' : 'Weiter →'}
        </button>
      </div>
    </div>
  )
}

// ── Helper: extrahiert plain Felder aus Kunde-Objekt ──────────────────────────
function toForm(k) {
  if (!k) return {}
  const { categories, appointments, ap_scores, kinder, anfrage_kategorien, ...rest } = k
  return {
    ...rest,
    ap_scores: ap_scores || {},
    kinder: kinder || [],
    anfrage_kategorien: anfrage_kategorien || [],
  }
}
