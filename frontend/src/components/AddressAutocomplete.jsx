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

export default function AddressAutocomplete({ value, onChange, onSelect, placeholder = 'Straße & Hausnummer' }) {
  const [suggestions, setSuggestions] = useState([])
  const [open, setOpen]               = useState(false)
  const [loading, setLoading]         = useState(false)
  const timer = useRef(null)

  useEffect(() => {
    if (!API_KEY || !value || value.length < 3) {
      setSuggestions([])
      setOpen(false)
      return
    }
    clearTimeout(timer.current)
    timer.current = setTimeout(async () => {
      setLoading(true)
      try {
        const url = `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(value)}&lang=de&filter=countrycode:de&limit=6&apiKey=${API_KEY}`
        const res  = await fetch(url)
        const data = await res.json()
        setSuggestions(data.features || [])
        setOpen(true)
      } catch {}
      finally { setLoading(false) }
    }, 300)
    return () => clearTimeout(timer.current)
  }, [value])

  function handleSelect(feature) {
    const p = feature.properties
    const strasse = [p.street, p.housenumber].filter(Boolean).join(' ')
    onSelect({
      strasse,
      plz: p.postcode || '',
      ort: p.city || p.municipality || p.county || '',
    })
    setSuggestions([])
    setOpen(false)
  }

  return (
    <div style={{ position: 'relative' }}>
      <input
        className="form-input"
        value={value}
        onChange={e => onChange(e.target.value)}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder={placeholder}
        autoComplete="off"
      />
      {loading && (
        <div style={{
          position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
          fontSize: 11, color: 'var(--muted)', pointerEvents: 'none',
        }}>…</div>
      )}
      {open && suggestions.length > 0 && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 2px)', left: 0, right: 0,
          background: 'var(--white)', border: '1px solid var(--line)',
          borderRadius: 8, boxShadow: 'var(--shadow)', zIndex: 100,
          maxHeight: 240, overflowY: 'auto',
        }}>
          {suggestions.map((f, i) => {
            const props = f.properties
            const main  = [props.street, props.housenumber].filter(Boolean).join(' ')
            const sub   = [props.postcode, props.city || props.municipality].filter(Boolean).join(' ')
            return (
              <div
                key={i}
                onMouseDown={() => handleSelect(f)}
                style={{
                  padding: '8px 12px', cursor: 'pointer',
                  borderBottom: i < suggestions.length - 1 ? '1px solid var(--line)' : 'none',
                  transition: 'background .1s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{main || props.formatted}</div>
                {sub && <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 1 }}>{sub}</div>}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
