import { useState, useEffect, useRef } from 'react'

const API_KEY = import.meta.env.VITE_GEOAPIFY_KEY

export async function validateAddress(text) {
  if (!API_KEY || !text || text.length < 5) return null
  try {
    const url = `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(text)}&lang=de&filter=countrycode:de&limit=1&apiKey=${API_KEY}`
    const res  = await fetch(url)
    const data = await res.json()
    const feat = data.features?.[0]
    if (!feat) return null
    const conf = feat.properties.rank?.confidence || 0
    if (conf < 0.8) return null
    const p = feat.properties
    return {
      strasse: [p.street, p.housenumber].filter(Boolean).join(' '),
      plz:     p.postcode || '',
      ort:     p.city || p.municipality || p.county || '',
    }
  } catch {
    return null
  }
}

export default function AddressAutocomplete({ onSelect }) {
  const [open, setOpen]             = useState(false)
  const [query, setQuery]           = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [loading, setLoading]       = useState(false)
  const timer = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50)
  }, [open])

  useEffect(() => {
    if (!query || query.length < 3) { setSuggestions([]); return }
    clearTimeout(timer.current)
    timer.current = setTimeout(async () => {
      setLoading(true)
      try {
        const url = `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(query)}&lang=de&filter=countrycode:de&limit=6&apiKey=${API_KEY}`
        const res  = await fetch(url)
        const data = await res.json()
        setSuggestions(data.features || [])
      } catch {}
      finally { setLoading(false) }
    }, 300)
    return () => clearTimeout(timer.current)
  }, [query])

  function handleSelect(feature) {
    const p = feature.properties
    onSelect({
      strasse: [p.street, p.housenumber].filter(Boolean).join(' '),
      plz:     p.postcode || '',
      ort:     p.city || p.municipality || p.county || '',
    })
    setOpen(false)
    setQuery('')
    setSuggestions([])
  }

  function handleClose() {
    setOpen(false)
    setQuery('')
    setSuggestions([])
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)}
        className="btn btn-ghost btn-sm"
        style={{ alignSelf: 'flex-start', fontSize: 12 }}>
        🔍 Adresse suchen
      </button>

      {open && (
        <div className="modal-overlay" onClick={handleClose}>
          <div className="modal" style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">🔍 Adresse suchen</span>
              <button className="btn btn-ghost btn-sm" onClick={handleClose}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ position: 'relative' }}>
                <input
                  ref={inputRef}
                  className="form-input"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Straße und Hausnummer eingeben…"
                  autoComplete="off"
                />
                {loading && (
                  <div style={{
                    position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                    fontSize: 11, color: 'var(--muted)', pointerEvents: 'none',
                  }}>…</div>
                )}
              </div>

              {suggestions.length > 0 && (
                <div style={{
                  marginTop: 8, border: '1px solid var(--line)', borderRadius: 8,
                  overflow: 'hidden',
                }}>
                  {suggestions.map((f, i) => {
                    const p   = f.properties
                    const main = [p.street, p.housenumber].filter(Boolean).join(' ')
                    const sub  = [p.postcode, p.city || p.municipality].filter(Boolean).join(' ')
                    return (
                      <div key={i} onClick={() => handleSelect(f)}
                        style={{
                          padding: '10px 14px', cursor: 'pointer',
                          borderBottom: i < suggestions.length - 1 ? '1px solid var(--line)' : 'none',
                          transition: 'background .1s',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--bg)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{main || p.formatted}</div>
                        {sub && <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{sub}</div>}
                      </div>
                    )
                  })}
                </div>
              )}

              {query.length >= 3 && !loading && suggestions.length === 0 && (
                <div style={{ marginTop: 12, fontSize: 13, color: 'var(--muted)', textAlign: 'center' }}>
                  Keine Treffer gefunden
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
