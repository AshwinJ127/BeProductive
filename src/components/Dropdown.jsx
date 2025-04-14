import { useState, useRef, useEffect } from 'react'

const options = [
  { value: 'all', label: 'All Tasks' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' }
]

function Dropdown({ value, onChange }) {
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

  const selected = options.find(opt => opt.value === value)

  return (
    <div className="relative inline-block text-left" ref={ref}>
      <button
        onClick={() => setOpen(prev => !prev)}
        className="bg-primary text-white text-sm font-semibold px-4 py-2 rounded-lg border-2 border-red-600 shadow-md hover:bg-red-700 transition"
      >
        {selected?.label}
        <span className="ml-2">▾</span>
      </button>

      {open && (
        <div className="absolute mt-2 w-40 rounded-lg shadow-xl z-20 bg-red-950 border border-red-700">
          {options.map(opt => (
            <button
              key={opt.value}
              onClick={() => {
                onChange(opt.value)
                setOpen(false)
              }}
              className={`w-full text-left px-4 py-2 text-sm transition 
                ${value === opt.value 
                  ? 'bg-red-700 text-white font-bold' 
                  : 'text-red-100 hover:bg-red-800 hover:text-white'
                }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default Dropdown
