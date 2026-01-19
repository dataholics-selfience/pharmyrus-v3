import { useState, useRef, useEffect } from 'react'
import { Check, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const COUNTRIES = [
  { code: 'BR', name: 'Brasil', flag: '🇧🇷' },
  { code: 'US', name: 'Estados Unidos', flag: '🇺🇸' },
  { code: 'MX', name: 'México', flag: '🇲🇽' },
  { code: 'CN', name: 'China', flag: '🇨🇳' },
  { code: 'JP', name: 'Japão', flag: '🇯🇵' },
  { code: 'DE', name: 'Alemanha', flag: '🇩🇪' },
  { code: 'FR', name: 'França', flag: '🇫🇷' },
  { code: 'GB', name: 'Reino Unido', flag: '🇬🇧' },
  { code: 'IT', name: 'Itália', flag: '🇮🇹' },
  { code: 'ES', name: 'Espanha', flag: '🇪🇸' },
  { code: 'CA', name: 'Canadá', flag: '🇨🇦' },
  { code: 'AU', name: 'Austrália', flag: '🇦🇺' },
  { code: 'IN', name: 'Índia', flag: '🇮🇳' },
  { code: 'KR', name: 'Coreia do Sul', flag: '🇰🇷' },
  { code: 'RU', name: 'Rússia', flag: '🇷🇺' },
  { code: 'NL', name: 'Holanda', flag: '🇳🇱' },
  { code: 'CH', name: 'Suíça', flag: '🇨🇭' },
  { code: 'SE', name: 'Suécia', flag: '🇸🇪' },
  { code: 'BE', name: 'Bélgica', flag: '🇧🇪' },
  { code: 'AT', name: 'Áustria', flag: '🇦🇹' },
]

interface CountryMultiSelectProps {
  value: string[]
  onChange: (countries: string[]) => void
}

export function CountryMultiSelect({ value, onChange }: CountryMultiSelectProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const toggleCountry = (code: string) => {
    if (value.includes(code)) {
      onChange(value.filter(c => c !== code))
    } else {
      onChange([...value, code])
    }
  }

  const selectedCountries = COUNTRIES.filter(c => value.includes(c.code))
  const displayText = selectedCountries.length === 0
    ? 'Selecione países...'
    : selectedCountries.length === 1
    ? `${selectedCountries[0].flag} ${selectedCountries[0].name}`
    : `${selectedCountries.length} países selecionados`

  return (
    <div className="relative" ref={ref}>
      <Button
        type="button"
        variant="outline"
        onClick={() => setOpen(!open)}
        className="w-full justify-between h-12 text-base font-normal"
      >
        <span className="truncate">{displayText}</span>
        <ChevronDown className={cn(
          "ml-2 h-4 w-4 shrink-0 transition-transform",
          open && "transform rotate-180"
        )} />
      </Button>

      {open && (
        <div className="absolute z-50 mt-2 w-full rounded-md border bg-popover p-2 shadow-lg">
          <div className="max-h-60 overflow-auto">
            {COUNTRIES.map((country) => {
              const isSelected = value.includes(country.code)
              
              return (
                <button
                  key={country.code}
                  type="button"
                  onClick={() => toggleCountry(country.code)}
                  className={cn(
                    "relative flex w-full cursor-pointer select-none items-center rounded-sm px-3 py-2 text-sm outline-none transition-colors",
                    "hover:bg-accent hover:text-accent-foreground",
                    isSelected && "bg-accent/50"
                  )}
                >
                  <div className="flex items-center gap-2 flex-1">
                    <span className="text-lg">{country.flag}</span>
                    <span>{country.name}</span>
                    <span className="text-xs text-muted-foreground">({country.code})</span>
                  </div>
                  {isSelected && (
                    <Check className="h-4 w-4 text-primary" />
                  )}
                </button>
              )
            })}
          </div>
          
          {value.length > 0 && (
            <div className="border-t pt-2 mt-2">
              <button
                type="button"
                onClick={() => onChange([])}
                className="w-full text-sm text-muted-foreground hover:text-foreground text-center py-1"
              >
                Limpar seleção
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
