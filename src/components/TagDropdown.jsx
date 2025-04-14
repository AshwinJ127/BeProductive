import { useState, useRef, useEffect } from 'react'

function TagDropdown({ value, onChange, tags }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  let selected = 'All Tags'
  if (value === 'no-tags') {
    selected = 'No Tags'
  } else if (value) {
    selected = tags.find(tag => tag.id === value)?.name || 'All Tags'
  }

  return (
    <div className="relative inline-block text-left" ref={ref}>
      <button
        onClick={() => setOpen(prev => !prev)}
        className="bg-primary text-white text-sm font-semibold px-4 py-2 rounded-lg border-2 border-red-600 shadow-md hover:bg-red-700 transition"
      >
        {selected}
        <span className="ml-2">▾</span>
      </button>

      {open && (
        <div className="absolute mt-2 w-40 rounded-lg shadow-xl z-20 bg-red-950 border border-red-700">
          <button
            onClick={() => {
              onChange(null)
              setOpen(false)
            }}
            className={`w-full text-left px-4 py-2 text-sm transition ${
              value === null
                ? 'bg-red-700 text-white font-bold'
                : 'text-red-100 hover:bg-red-800 hover:text-white'
            }`}
          >
            All Tags
          </button>
          <button
            onClick={() => {
              onChange('no-tags')
              setOpen(false)
            }}
            className={`w-full text-left px-4 py-2 text-sm transition ${
              value === 'no-tags'
                ? 'bg-red-700 text-white font-bold'
                : 'text-red-100 hover:bg-red-800 hover:text-white'
            }`}
          >
            No Tags
          </button>
          {tags.map(tag => (
            <button
              key={tag.id}
              onClick={() => {
                onChange(tag.id)
                setOpen(false)
              }}
              className={`w-full text-left px-4 py-2 text-sm transition ${
                value === tag.id
                  ? 'bg-red-700 text-white font-bold'
                  : 'text-red-100 hover:bg-red-800 hover:text-white'
              }`}
            >
              {tag.name}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default TagDropdown
