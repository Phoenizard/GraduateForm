import { useState, useRef, useEffect } from 'react'
import { universities } from '../../data/universities'

export default function SchoolInput({ value, onChange, placeholder }) {
  const [open, setOpen] = useState(false)
  const [suggestions, setSuggestions] = useState([])
  const wrapperRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleChange = (e) => {
    const val = e.target.value
    onChange(val)
    if (val.length >= 2) {
      const lower = val.toLowerCase()
      const matched = universities.filter((u) => u.toLowerCase().includes(lower)).slice(0, 8)
      setSuggestions(matched)
      setOpen(matched.length > 0)
    } else {
      setOpen(false)
    }
  }

  const handleSelect = (name) => {
    onChange(name)
    setOpen(false)
  }

  return (
    <div ref={wrapperRef} className="relative">
      <input
        type="text"
        value={value || ''}
        onChange={handleChange}
        onFocus={() => {
          if (suggestions.length > 0 && (value || '').length >= 2) setOpen(true)
        }}
        placeholder={placeholder || '搜索或输入学校名'}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 transition-colors"
      />
      {open && (
        <ul className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {suggestions.map((name) => (
            <li
              key={name}
              onClick={() => handleSelect(name)}
              className="px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 transition-colors"
            >
              {name}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
