import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { leads, customers } from '../lib/api'

export default function TestSimulation() {
  const navigate = useNavigate()

  const [testEmail, setTestEmail]         = useState('')
  const [testResult, setTestResult]       = useState(null)
  const [testing, setTesting]             = useState(false)
  const [simResult, setSimResult]         = useState(null)
  const [simming, setSimming]             = useState(false)
  const [simCustomerId, setSimCustomerId] = useState('')
  const [kundenListe, setKundenListe]     = useState([])

  useEffect(() => {
    customers.list().then(setKundenListe).catch(() => {})
  }, [])

  async function runTestImport() {
    if (!testEmail.trim()) return
    setTesting(true)
    setTestResult(null)
    setSimResult(null)
    try {
      const r = await leads.import(testEmail)
      setTestResult({ ok: true, ...r })
      customers.list().then(setKundenListe).catch(() => {})
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

  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-title">Test-Simulation</div>
          <div className="page-sub">Manuelle Tests für Prozesse die noch nicht automatisiert sind</div>
        </div>
      </div>

      <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 20, padding: '10px 14px', background: '#fef9c3', borderRadius: 8, border: '1px solid #fde68a', maxWidth: 640 }}>
        Diese Simulationen ersetzen Prozesse, die später automatisch ablaufen werden (z.B. IMAP-Abruf, WhatsApp-Webhook).
        Bis dahin können sie hier manuell ausgelöst werden.
      </div>

      {/* ── Eingang simulieren ── */}
      <div className="card" style={{ maxWidth: 640, marginBottom: 16 }}>
        <div className="section-label" style={{ marginBottom: 4 }}>Lead-Eingang simulieren</div>
        <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 12 }}>
          E-Mail-Text einer Lead-Benachrichtigung einfügen → Kunde wird angelegt, Kategorie zugeordnet.
        </div>
        <textarea className="form-textarea" rows={10} value={testEmail}
          onChange={e => setTestEmail(e.target.value)}
          placeholder="E-Mail-Text hier einfügen…"
          style={{ fontFamily: 'monospace', fontSize: 12, marginBottom: 8 }} />
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
      </div>

      {/* ── Ausgang simulieren ── */}
      <div className="card" style={{ maxWidth: 640 }}>
        <div className="section-label" style={{ marginBottom: 4 }}>Ausgangs-Information simulieren</div>
        <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 12 }}>
          Simuliert den erfolgreichen Versand einer automatischen Nachricht an einen Kunden.
          Erstellt Terminverlauf-Eintrag + Aufgabe "Termin prüfen".
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
        </div>
        {simResult && (
          <div style={{ marginTop: 10, fontSize: 13, fontWeight: 600, color: simResult.ok ? 'var(--green)' : 'var(--red)' }}>
            {simResult.ok ? '✓ Aufgabe "Termin prüfen" erstellt' : `✗ ${simResult.error}`}
          </div>
        )}
      </div>
    </>
  )
}
