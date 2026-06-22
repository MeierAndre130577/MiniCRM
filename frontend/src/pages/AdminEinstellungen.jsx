import { useState, useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { settings, leads } from '../lib/api'

const DEFAULT_SMTP = { host: '', port: '587', user: '', password: '' }

const DEFAULT_STATUS = [
  'Neuer Lead', 'Termin angefragt', 'Termin gebucht',
  'Termin stattgefunden', 'Nachfassen / Angebot offen',
  'Bestandskunde', 'Verloren',
]

const DEFAULT_TEMPLATE = `Hallo {{vorname}},

vielen Dank für Ihre Anfrage zur {{produkt}}! Ich freue mich über Ihr Interesse.

Ich werde mich in Kürze persönlich bei Ihnen melden. Wenn Sie möchten, können Sie auch direkt einen Wunschtermin buchen:
{{buchungslink}}

Mit freundlichen Grüßen
{{berater}}
Finanz-Team Schmidt GmbH`

const KATEGORIE_OPTIONS = [
  { value: 'alter',            label: 'Alter' },
  { value: 'vermoegen',        label: 'Vermögen' },
  { value: 'einkommensschutz', label: 'EK-Schutz' },
  { value: 'gesundheit',       label: 'Gesundheit' },
  { value: 'wohnwuensche',     label: 'Wohnen' },
  { value: 'todesfall',        label: 'Todesfall' },
  { value: 'haftpflicht',      label: 'Haftpflicht' },
  { value: 'hausrat',          label: 'Hausrat' },
  { value: 'gebaeude',         label: 'Gebäude' },
  { value: 'rechtsschutz',     label: 'Rechtsschutz' },
  { value: 'unfall',           label: 'Unfall' },
  { value: 'tier',             label: 'Tier' },
  { value: 'kfz',              label: 'KFZ' },
  { value: 'kindervorsorge',   label: 'Kindervorsorge' },
  { value: 'immobilien',       label: 'Immobilien' },
]

function useSetting(key, defaultValue) {
  const [value, setValue] = useState(defaultValue)
  const [saving, setSaving] = useState(false)
  const [saved,  setSaved]  = useState(false)

  useEffect(() => {
    settings.get(key)
      .then(r => { if (r.value !== undefined && r.value !== null) setValue(r.value) })
      .catch(() => {})
  }, [key])

  async function save(v) {
    setSaving(true)
    try {
      await settings.set(key, v)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (e) { alert(e.message) }
    finally { setSaving(false) }
  }

  return { value, setValue, saving, saved, save }
}

export default function AdminEinstellungen() {
  const location = useLocation()
  const leadRef  = useRef(null)

  useEffect(() => {
    if (location.search.includes('section=lead') && leadRef.current) {
      leadRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [location.search])

  // ── Terminverlauf Status ──
  const tv = useSetting('terminverlauf_status', DEFAULT_STATUS)
  const [newStatus, setNewStatus] = useState('')

  function addStatus() {
    const v = newStatus.trim()
    if (!v || tv.value.includes(v)) return
    const next = [...tv.value, v]
    tv.setValue(next)
    setNewStatus('')
    tv.save(next)
  }
  function removeStatus(i) {
    const next = tv.value.filter((_, idx) => idx !== i)
    tv.setValue(next)
    tv.save(next)
  }
  function moveStatus(i, dir) {
    const next = [...tv.value]
    const j = i + dir
    if (j < 0 || j >= next.length) return
    ;[next[i], next[j]] = [next[j], next[i]]
    tv.setValue(next)
    tv.save(next)
  }

  const navigate = useNavigate()

  // ── Lead Produkt-Mapping ──
  const mapping = useSetting('lead_produkt_mapping', [])
  const [newProdukt, setNewProdukt]     = useState('')
  const [newKategorie, setNewKategorie] = useState(KATEGORIE_OPTIONS[0].value)
  const [applyResult, setApplyResult]   = useState(null)
  const [report, setReport]             = useState(null)
  const [reportLoading, setReportLoading] = useState(false)

  async function loadReport() {
    setReportLoading(true)
    try { setReport(await leads.unmappedReport()) }
    catch (e) { console.error(e) }
    finally { setReportLoading(false) }
  }

  useEffect(() => { loadReport() }, [])

  async function addMapping() {
    const p = newProdukt.trim()
    if (!p) return
    const next = [...(mapping.value || []), { produkt: p, kategorie: newKategorie }]
    mapping.setValue(next)
    setNewProdukt('')
    await mapping.save(next)
    const r = await leads.applyMapping()
    setApplyResult(r.applied)
    await loadReport()
  }

  function removeMapping(i) {
    const next = (mapping.value || []).filter((_, idx) => idx !== i)
    mapping.setValue(next)
    mapping.save(next)
  }

  // ── Antwort-Template ──
  const template    = useSetting('lead_antwort_template', DEFAULT_TEMPLATE)
  const buchungslink = useSetting('lead_buchungslink', '')
  const kanal        = useSetting('lead_antwortkanal', 'email')

  // ── SMTP ──
  const [smtp, setSmtp] = useState(DEFAULT_SMTP)
  const [smtpFromName, setSmtpFromName] = useState('')
  const [smtpSaved, setSmtpSaved] = useState(false)

  useEffect(() => {
    settings.get('smtp_config').then(r => { if (r.value) setSmtp(r.value) }).catch(() => {})
    settings.get('smtp_from_name').then(r => { if (r.value) setSmtpFromName(r.value) }).catch(() => {})
  }, [])

  async function saveSmtp() {
    await settings.set('smtp_config', smtp)
    await settings.set('smtp_from_name', smtpFromName)
    setSmtpSaved(true)
    setTimeout(() => setSmtpSaved(false), 2000)
  }

  // ── Lead Test-Import ──
  const [testEmail, setTestEmail]     = useState('')
  const [testResult, setTestResult]   = useState(null)
  const [testing, setTesting]         = useState(false)
  const [simResult, setSimResult]         = useState(null)
  const [simming, setSimming]             = useState(false)
  const [simCustomerId, setSimCustomerId] = useState('')
  const [kundenListe, setKundenListe]     = useState([])

  useEffect(() => {
    import('../lib/api').then(({ customers }) => {
      customers.list().then(setKundenListe).catch(() => {})
    })
  }, [])

  async function runTestImport() {
    if (!testEmail.trim()) return
    setTesting(true)
    setTestResult(null)
    setSimResult(null)
    try {
      const r = await leads.import(testEmail)
      setTestResult({ ok: true, ...r })
    } catch (e) {
      setTestResult({ ok: false, error: e.message })
    } finally { setTesting(false) }
  }

  async function runSimulateSent() {
    const id = testResult?.customer_id || simCustomerId
    if (!id) return
    setSimming(true)
    setSimResult(null)
    try {
      await leads.simulateSent(id)
      setSimResult({ ok: true })
    } catch (e) {
      setSimResult({ ok: false, error: e.message })
    } finally { setSimming(false) }
  }

  const anySaved = tv.saved || mapping.saved || template.saved || buchungslink.saved || kanal.saved

  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-title">Einstellungen</div>
          <div className="page-sub">Systemkonfiguration</div>
        </div>
        {anySaved && <span style={{ marginLeft: 'auto', fontSize: 13, color: 'var(--green)', fontWeight: 600 }}>Gespeichert ✓</span>}
      </div>

      {/* ── Terminverlauf Status ── */}
      <div className="card" style={{ maxWidth: 520, marginBottom: 16 }}>
        <div className="section-label" style={{ marginBottom: 4 }}>Terminverlauf — Status-Auswahl</div>
        <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 16 }}>
          Diese Einträge stehen im Terminverlauf bei jedem Kundentermin zur Auswahl.
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
          {(tv.value || []).map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 8, border: '1px solid var(--line)', background: 'var(--white)' }}>
              <span style={{ flex: 1, fontSize: 14 }}>{item}</span>
              <button type="button" onClick={() => moveStatus(i, -1)} disabled={i === 0}
                style={{ background: 'none', border: 'none', cursor: i === 0 ? 'default' : 'pointer', color: 'var(--muted)', fontSize: 14, padding: '0 4px', opacity: i === 0 ? 0.3 : 1 }}>▲</button>
              <button type="button" onClick={() => moveStatus(i, 1)} disabled={i === tv.value.length - 1}
                style={{ background: 'none', border: 'none', cursor: i === tv.value.length - 1 ? 'default' : 'pointer', color: 'var(--muted)', fontSize: 14, padding: '0 4px', opacity: i === tv.value.length - 1 ? 0.3 : 1 }}>▼</button>
              <button type="button" onClick={() => removeStatus(i)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--red)', fontSize: 15, padding: '0 4px' }}>✕</button>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input className="form-input" placeholder="Neuer Eintrag…" value={newStatus}
            onChange={e => setNewStatus(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addStatus())}
            style={{ flex: 1 }} />
          <button className="btn btn-primary" type="button" onClick={addStatus} disabled={!newStatus.trim()}>
            + Hinzufügen
          </button>
        </div>
      </div>

      {/* ── Lead Import Einstellungen ── */}
      <div ref={leadRef} style={{ scrollMarginTop: 24 }}>
        <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 12, color: 'var(--text)' }}>
          Lead-Import
        </div>

        {/* Produkt-Mapping + Bericht nebeneinander */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16, maxWidth: 900 }}>

          {/* Mapping-Tabelle */}
          <div className="card">
            <div className="section-label" style={{ marginBottom: 4 }}>Produkt → Kategorie Mapping</div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 12 }}>
              Welches Produkt entspricht welcher Kategorie?
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
              {(mapping.value || []).length === 0 && (
                <div style={{ fontSize: 13, color: 'var(--muted)' }}>Noch kein Mapping hinterlegt.</div>
              )}
              {(mapping.value || []).map((m, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', borderRadius: 8, border: '1px solid var(--line)', background: 'var(--white)' }}>
                  <span style={{ flex: 1, fontSize: 12 }}>{m.produkt}</span>
                  <span style={{ fontSize: 11, color: 'var(--muted)' }}>→</span>
                  <span style={{ fontSize: 12, fontWeight: 600 }}>
                    {KATEGORIE_OPTIONS.find(o => o.value === m.kategorie)?.label || m.kategorie}
                  </span>
                  <button type="button" onClick={() => removeMapping(i)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--red)', fontSize: 14, padding: '0 2px' }}>✕</button>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <input className="form-input" placeholder="Produktname aus der E-Mail"
                value={newProdukt} onChange={e => setNewProdukt(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addMapping())} />
              <select className="form-select" value={newKategorie}
                onChange={e => setNewKategorie(e.target.value)}>
                {KATEGORIE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <button className="btn btn-primary btn-sm" type="button" onClick={addMapping} disabled={!newProdukt.trim()}>
                + Hinzufügen & anwenden
              </button>
            </div>
            {applyResult !== null && (
              <div style={{ marginTop: 8, fontSize: 12, fontWeight: 600, color: applyResult > 0 ? 'var(--green)' : 'var(--muted)' }}>
                {applyResult > 0 ? `✓ ${applyResult} Kunde${applyResult > 1 ? 'n' : ''} aktualisiert` : 'Keine neuen Kunden zum Aktualisieren'}
              </div>
            )}
          </div>

          {/* Bericht: nicht zugeordnete Leads */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
              <div className="section-label" style={{ margin: 0 }}>Bericht: Nicht zugeordnet</div>
              <button type="button" className="btn btn-ghost btn-sm" style={{ marginLeft: 'auto' }}
                onClick={loadReport}>↻</button>
            </div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 12 }}>
              Leads ohne Kategorie-Zuordnung
            </div>
            {reportLoading ? (
              <div style={{ fontSize: 13, color: 'var(--muted)' }}>Laden…</div>
            ) : !report || report.length === 0 ? (
              <div style={{ fontSize: 13, color: 'var(--green)', fontWeight: 600 }}>✓ Alle Leads zugeordnet</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {report.filter(r => !r.has_kategorie).map(r => (
                  <div key={r.customer_id} style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #fde68a', background: '#fef9c3', fontSize: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontWeight: 700 }}>{r.name}</span>
                      <button type="button" onClick={() => navigate(`/kunden/${r.customer_id}?tab=uebersicht`)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#2563eb', fontSize: 11, padding: 0, textDecoration: 'underline' }}>
                        ID {r.customer_id} →
                      </button>
                    </div>
                    <div style={{ color: '#a16207', marginTop: 2 }}>
                      Produkt: <strong>{r.produkt}</strong>
                      {r.mapped ? <span style={{ color: 'var(--green)', marginLeft: 6 }}>✓ Mapping vorhanden</span>
                               : <span style={{ color: 'var(--red)', marginLeft: 6 }}>✗ Kein Mapping</span>}
                    </div>
                  </div>
                ))}
                {report.filter(r => !r.has_kategorie).length === 0 && (
                  <div style={{ fontSize: 13, color: 'var(--green)', fontWeight: 600 }}>✓ Alle Leads zugeordnet</div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Antwort-Einstellungen */}
        <div className="card" style={{ maxWidth: 600, marginBottom: 16 }}>
          <div className="section-label" style={{ marginBottom: 16 }}>Automatische Antwort</div>

          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Antwortkanal</div>
            <div style={{ display: 'flex', gap: 8 }}>
              {[
                { value: 'email',     label: 'E-Mail' },
                { value: 'whatsapp',  label: 'WhatsApp' },
                { value: 'beide',     label: 'E-Mail + WhatsApp' },
              ].map(o => (
                <button key={o.value} type="button"
                  onClick={() => { kanal.setValue(o.value); kanal.save(o.value) }}
                  className={`btn btn-sm ${kanal.value === o.value ? 'btn-primary' : 'btn-ghost'}`}>
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Buchungslink</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input className="form-input" placeholder="https://calendly.com/…"
                value={buchungslink.value || ''}
                onChange={e => buchungslink.setValue(e.target.value)}
                style={{ flex: 1 }} />
              <button className="btn btn-primary btn-sm" type="button"
                onClick={() => buchungslink.save(buchungslink.value)}>
                Speichern
              </button>
            </div>
          </div>

          <div>
            <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
              Antwort-Template
              <span style={{ fontWeight: 400, color: 'var(--muted)', marginLeft: 8 }}>
                Platzhalter: {'{{vorname}}'} {'{{produkt}}'} {'{{buchungslink}}'} {'{{berater}}'}
              </span>
            </div>
            <textarea className="form-textarea" rows={8}
              value={template.value || ''}
              onChange={e => template.setValue(e.target.value)}
              style={{ fontFamily: 'monospace', fontSize: 13 }} />
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
              <button className="btn btn-primary btn-sm" type="button"
                onClick={() => template.save(template.value)}>
                Speichern
              </button>
            </div>
          </div>
        </div>

        {/* SMTP */}
        <div className="card" style={{ maxWidth: 600, marginBottom: 16 }}>
          <div className="section-label" style={{ marginBottom: 4 }}>
            E-Mail Versand (SMTP)
            {smtpSaved && <span style={{ marginLeft: 12, fontSize: 12, color: 'var(--green)', fontWeight: 600 }}>Gespeichert ✓</span>}
          </div>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 16 }}>
            Zugangsdaten für den automatischen E-Mail-Versand. Benötigt SMTP mit STARTTLS (Port 587).
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Absender-Name</div>
              <input className="form-input" placeholder="Max Mustermann"
                value={smtpFromName} onChange={e => setSmtpFromName(e.target.value)} />
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>SMTP-Host</div>
              <input className="form-input" placeholder="smtp.gmail.com"
                value={smtp.host} onChange={e => setSmtp(s => ({ ...s, host: e.target.value }))} />
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Port</div>
              <input className="form-input" placeholder="587"
                value={smtp.port} onChange={e => setSmtp(s => ({ ...s, port: e.target.value }))} />
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Benutzername (E-Mail)</div>
              <input className="form-input" placeholder="leads@domain.de"
                value={smtp.user} onChange={e => setSmtp(s => ({ ...s, user: e.target.value }))} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Passwort</div>
              <input className="form-input" type="password" placeholder="••••••••"
                value={smtp.password} onChange={e => setSmtp(s => ({ ...s, password: e.target.value }))} />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button className="btn btn-primary btn-sm" type="button" onClick={saveSmtp}>
              Speichern
            </button>
          </div>
        </div>

        {/* Test-Import */}
        <div className="card" style={{ maxWidth: 600 }}>
          <div className="section-label" style={{ marginBottom: 4 }}>Lead-E-Mail testen</div>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 12 }}>
            Füge hier eine Lead-E-Mail ein um den Import zu testen.
          </div>
          <textarea className="form-textarea" rows={10} value={testEmail}
            onChange={e => setTestEmail(e.target.value)}
            placeholder="E-Mail-Text hier einfügen…"
            style={{ fontFamily: 'monospace', fontSize: 12, marginBottom: 8 }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {/* Eingang */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button className="btn btn-primary" type="button"
                onClick={runTestImport} disabled={testing || !testEmail.trim()}>
                {testing ? 'Verarbeite…' : '📥 Eingang simulieren'}
              </button>
              {testResult && testResult.ok && (
                <div style={{ fontSize: 12 }}>
                  <div style={{ fontWeight: 600, color: 'var(--green)', marginBottom: 4 }}>
                    ✓ Kunde angelegt —{' '}
                    <button type="button" onClick={() => navigate(`/kunden/${testResult.customer_id}?tab=uebersicht`)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#2563eb', fontSize: 12, fontWeight: 700, padding: 0, textDecoration: 'underline' }}>
                      ID {testResult.customer_id} öffnen →
                    </button>
                  </div>
                  <div style={{ color: 'var(--muted)', fontFamily: 'monospace', fontSize: 11, lineHeight: 1.6 }}>
                    Produkt erkannt: <strong style={{ color: 'var(--text)' }}>{testResult.debug?.parsed_produkt}</strong><br/>
                    Mapping gefunden: <strong style={{ color: testResult.debug?.match_found ? 'var(--green)' : 'var(--red)' }}>
                      {testResult.debug?.match_found ? `✓ → ${testResult.kategorie}` : '✗ kein Treffer'}
                    </strong><br/>
                    Bekannte Mappings: <strong style={{ color: 'var(--text)' }}>{testResult.debug?.mapping_keys?.join(', ') || '—'}</strong>
                  </div>
                </div>
              )}
              {testResult && !testResult.ok && (
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--red)' }}>✗ {testResult.error}</span>
              )}
            </div>

            {/* Ausgang — unabhängig, Kunden-ID eingeben */}
            <div style={{ borderTop: '1px solid var(--line)', paddingTop: 12 }}>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 8 }}>
                Ausgangs-Simulation: Kunden-ID eingeben (z.B. aus dem Eingang oben)
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <select className="form-select" value={simCustomerId}
                  onChange={e => setSimCustomerId(e.target.value)} style={{ flex: 1 }}>
                  <option value="">— Kunde auswählen —</option>
                  {kundenListe.map(k => (
                    <option key={k.id} value={k.id}>
                      {k.p1_vorname} {k.p1_nachname}
                    </option>
                  ))}
                </select>
                <button className="btn btn-ghost" type="button"
                  onClick={runSimulateSent} disabled={simming || !simCustomerId}>
                  {simming ? 'Simuliere…' : '📤 Ausgangs-Information erfolgreich'}
                </button>
                {simResult && (
                  <span style={{ fontSize: 13, fontWeight: 600, color: simResult.ok ? 'var(--green)' : 'var(--red)' }}>
                    {simResult.ok ? '✓ Aufgabe "Termin prüfen" erstellt' : `✗ ${simResult.error}`}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
