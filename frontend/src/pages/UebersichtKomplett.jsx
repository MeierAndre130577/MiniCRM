import { useNavigate } from 'react-router-dom'
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

function statusColor(s) {
  if (s === 'besprochen')     return { bg: 'var(--status-fu-bg)', color: 'var(--status-fu-c)', border: 'var(--status-fu-b)' }
  if (s === 'offen')          return { bg: 'var(--status-td-bg)', color: 'var(--status-td-c)', border: 'var(--status-td-b)' }
  if (s === 'kein_interesse') return { bg: 'var(--status-ov-bg)', color: 'var(--status-ov-c)', border: 'var(--status-ov-b)' }
  return { bg: 'var(--section-bg)', color: 'var(--muted)', border: 'var(--line)' }
}

function SectionHeader({ title, tab, id }) {
  const navigate = useNavigate()
  return (
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
      <div style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--muted)' }}>
        {title}
      </div>
      {tab && (
        <button type="button" onClick={() => navigate(`/kunden/${id}?tab=${tab}`)}
          className="btn btn-ghost btn-sm"
          style={{ marginLeft: 'auto', fontSize: 11 }}>
          Bearbeiten →
        </button>
      )}
    </div>
  )
}

function Row({ label, value }) {
  if (value === null || value === undefined || value === '') return null
  return (
    <div style={{ display: 'flex', gap: 10, padding: '5px 0', borderBottom: '1px solid var(--line)', fontSize: 13 }}>
      <span style={{ color: 'var(--muted)', minWidth: 130, flexShrink: 0 }}>{label}</span>
      <span style={{ fontWeight: 500, color: 'var(--text)', wordBreak: 'break-word' }}>{value}</span>
    </div>
  )
}

function fmtEuro(v) {
  if (v == null || v === '') return null
  return Number(v).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'
}

function fmtDate(d) {
  if (!d) return null
  return new Date(d).toLocaleDateString('de-DE')
}

function PersonCard({ k, prefix, id }) {
  const g = (field) => k[`${prefix}_${field}`]
  const adresse = [g('strasse'), [g('plz'), g('ort')].filter(Boolean).join(' ')].filter(Boolean).join(', ')
  const name = [g('vorname'), g('nachname')].filter(Boolean).join(' ')
  if (!name) return null

  return (
    <div className="card" style={{ flex: 1, minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <div style={{ fontWeight: 800, fontSize: 15 }}>{name}</div>
        {g('anrede') && <span style={{ fontSize: 11, color: 'var(--muted)' }}>{g('anrede')}</span>}
        {g('raucher') === 1 && <span style={{ fontSize: 11, background: 'var(--status-ov-bg)', color: 'var(--status-ov-c)', padding: '1px 7px', borderRadius: 10 }}>Raucher</span>}
      </div>
      <Row label="Geburtsdatum"   value={fmtDate(g('geburtsdatum'))} />
      <Row label="Familienstand"  value={g('familienstand')} />
      <Row label="E-Mail"         value={g('email')} />
      <Row label="Handy"          value={g('handy')} />
      <Row label="Festnetz"       value={g('festnetz')} />
      <Row label="Adresse"        value={adresse} />
      <Row label="Beruf"          value={g('beruf')} />
      <Row label="Arbeitgeber"    value={g('arbeitgeber')} />
      <Row label="Arbeitsverhältnis" value={g('arbeitsverhaeltnis')} />
      <Row label="Abschluss"      value={g('abschluss')} />
      <Row label="Gehalt netto"   value={fmtEuro(g('gehalt_netto'))} />
      <Row label="Gehalt brutto"  value={fmtEuro(g('gehalt_brutto'))} />
      <Row label="GKV-Anbieter"   value={g('gkv_anbieter')} />
      <Row label="GKV-Stand"      value={g('gkv_stand')} />
      <Row label="IBAN"           value={g('iban')} />
      <Row label="Hobby"          value={g('hobby')} />
      <Row label="Haustiere"      value={g('haustiere')} />
    </div>
  )
}

export default function UebersichtKomplett({ kunde, cats, contracts, id }) {
  const navigate = useNavigate()
  const appts = kunde.appointments || []
  const filledContracts = Object.entries(KATEGORIE_META).flatMap(([k, m]) =>
    (contracts[k] || []).map(c => ({ ...c, _key: k, _meta: m }))
  )

  const einnahmen = (Number(kunde.hhr_einnahmen_gehalt) || 0)
    + (Number(kunde.hhr_einnahmen_zuschuesse) || 0)
    + (Number(kunde.hhr_einnahmen_weitere) || 0)
  const freierBetrag = kunde.hhr_freier_betrag
    || (einnahmen && kunde.hhr_ausgaben_gesamt ? einnahmen - Number(kunde.hhr_ausgaben_gesamt) : null)

  const hasBudget = kunde.budget_absicherung_monatlich || kunde.budget_absicherung_einmalig
    || kunde.budget_ansparung_monatlich || kunde.budget_ansparung_einmalig
    || kunde.hhr_einnahmen_gehalt || kunde.hhr_ausgaben_gesamt

  const hasP2 = !!(kunde.p2_vorname || kunde.p2_nachname)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* ── Export ── */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <a href={customers.exportExcelUrl(Number(id))} download
          className="btn btn-primary btn-sm" style={{ textDecoration: 'none' }}>
          Excel-Analyse herunterladen
        </a>
      </div>

      {/* ── Personen ── */}
      <div>
        <SectionHeader title="Personen" tab="stammdaten" id={id} />
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <PersonCard k={kunde} prefix="p1" id={id} />
          {hasP2 && <PersonCard k={kunde} prefix="p2" id={id} />}
        </div>
      </div>

      {/* ── Agenturdaten ── */}
      <div className="card">
        <SectionHeader title="Agenturdaten" tab="stammdaten" id={id} />
        <Row label="Berater"       value={kunde.berater} />
        <Row label="Kontaktquelle" value={Array.isArray(kunde.kontaktquelle) ? kunde.kontaktquelle.join(', ') : kunde.kontaktquelle} />
        <Row label="Folgetermin"   value={fmtDate(kunde.folgetermin_datum)} />
        {kunde.folgetermin_notizen && (
          <Row label="Folge-Notiz" value={kunde.folgetermin_notizen} />
        )}
      </div>

      {/* ── Kategorien ── */}
      <div>
        <SectionHeader title="Kategorien" tab="kategorien" id={id} />
        <div className="card" style={{ padding: '12px 14px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6 }}>
            {Object.entries(KATEGORIE_META).map(([key, meta]) => {
              const status = (cats[key] || {}).status || 'nicht_besprochen'
              const { bg, color, border } = statusColor(status)
              const notizen = (cats[key] || {}).notizen
              return (
                <div key={key} onClick={() => navigate(`/kunden/${id}?tab=kategorien`)}
                  title={notizen || undefined}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                    padding: '8px 4px', borderRadius: 8, cursor: 'pointer',
                    border: `1px solid ${border}`, background: bg,
                  }}>
                  <span style={{ fontSize: 18 }}>{meta.icon}</span>
                  <span style={{ fontSize: 10, fontWeight: 600, textAlign: 'center', color, lineHeight: 1.3 }}>
                    {meta.label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Budget ── */}
      {hasBudget && (
        <div>
          <SectionHeader title="Budget" tab="budget" id={id} />
          <div className="card">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 32px' }}>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--muted)', marginBottom: 6 }}>Neuverträge</div>
                <Row label="Absicherung mtl."  value={fmtEuro(kunde.budget_absicherung_monatlich)} />
                <Row label="Absicherung einm." value={fmtEuro(kunde.budget_absicherung_einmalig)} />
                <Row label="Ansparung mtl."    value={fmtEuro(kunde.budget_ansparung_monatlich)} />
                <Row label="Ansparung einm."   value={fmtEuro(kunde.budget_ansparung_einmalig)} />
                {kunde.budget_notizen && <Row label="Notiz" value={kunde.budget_notizen} />}
              </div>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--muted)', marginBottom: 6 }}>Haushaltsrechner</div>
                <Row label="Gehalt gesamt"     value={fmtEuro(kunde.hhr_einnahmen_gehalt)} />
                <Row label="Zuschüsse"         value={fmtEuro(kunde.hhr_einnahmen_zuschuesse)} />
                <Row label="Weitere Einnahmen" value={fmtEuro(kunde.hhr_einnahmen_weitere)} />
                <Row label="Ausgaben gesamt"   value={fmtEuro(kunde.hhr_ausgaben_gesamt)} />
                {freierBetrag != null && (
                  <div style={{ display: 'flex', gap: 10, padding: '5px 0', marginTop: 4, fontSize: 13, borderTop: '2px solid var(--line)' }}>
                    <span style={{ color: 'var(--muted)', minWidth: 130, flexShrink: 0 }}>Freier Betrag</span>
                    <span style={{ fontWeight: 800, color: 'var(--green)' }}>{fmtEuro(freierBetrag)}</span>
                  </div>
                )}
                {kunde.hhr_notizen && <Row label="Notiz" value={kunde.hhr_notizen} />}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Verträge ── */}
      {filledContracts.length > 0 && (
        <div>
          <SectionHeader title="Verträge" tab="vertraege" id={id} />
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <table className="table" style={{ margin: 0 }}>
              <thead>
                <tr>
                  <th>Kategorie</th>
                  <th>Gesellschaft</th>
                  <th>Police-Nr.</th>
                  <th>Ablauf</th>
                  <th>Beitrag alt</th>
                  <th>Beitrag neu</th>
                </tr>
              </thead>
              <tbody>
                {filledContracts.map(c => (
                  <tr key={c.id} onClick={() => navigate(`/kunden/${id}?tab=vertraege`)} style={{ cursor: 'pointer' }}>
                    <td><span style={{ fontSize: 14 }}>{c._meta.icon}</span> {c._meta.label}</td>
                    <td>{c.gesellschaft || '—'}</td>
                    <td style={{ color: 'var(--muted)', fontSize: 12 }}>{c.police_nr || '—'}</td>
                    <td style={{ fontSize: 12 }}>{fmtDate(c.ablaufdatum) || '—'}</td>
                    <td style={{ color: 'var(--muted)' }}>{fmtEuro(c.beitrag_alt) || '—'}</td>
                    <td style={{ fontWeight: 700, color: 'var(--green)' }}>{fmtEuro(c.beitrag_neu) || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Termine ── */}
      {appts.length > 0 && (
        <div>
          <SectionHeader title="Terminverlauf" tab="termine" id={id} />
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <table className="table" style={{ margin: 0 }}>
              <thead>
                <tr><th>Datum</th><th>Status</th><th>Notizen</th></tr>
              </thead>
              <tbody>
                {[...appts].sort((a, b) => new Date(b.datum) - new Date(a.datum)).map(a => (
                  <tr key={a.id}>
                    <td style={{ whiteSpace: 'nowrap', fontSize: 13 }}>{fmtDate(a.datum)}</td>
                    <td><span style={{ fontSize: 12 }}>{a.status || '—'}</span></td>
                    <td style={{ fontSize: 12, color: 'var(--muted)' }}>{a.notizen || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Notizen ── */}
      {kunde.notizen && (
        <div>
          <SectionHeader title="Notizen" tab="notizen" id={id} />
          <div className="card">
            <div style={{ fontSize: 13, color: 'var(--text)', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
              {kunde.notizen}
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
