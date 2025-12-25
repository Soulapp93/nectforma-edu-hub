import * as React from "react"
import { Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"

interface TimePickerProps {
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  id?: string
}

const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'))
const minutes = ['00', '15', '30', '45']

export function TimePicker({
  value,
  onChange,
  placeholder = "Sélectionner l'heure",
  className,
  disabled,
  id
}: TimePickerProps) {
  const [open, setOpen] = React.useState(false)
  const [selectedHour, setSelectedHour] = React.useState<string>('')
  const [selectedMinute, setSelectedMinute] = React.useState<string>('')

  React.useEffect(() => {
    if (value) {
      const [h, m] = value.split(':')
      setSelectedHour(h || '')
      setSelectedMinute(m || '00')
    }
  }, [value])

  const handleHourSelect = (hour: string) => {
    setSelectedHour(hour)
    const newTime = `${hour}:${selectedMinute || '00'}`
    onChange?.(newTime)
  }

  const handleMinuteSelect = (minute: string) => {
    setSelectedMinute(minute)
    if (selectedHour) {
      const newTime = `${selectedHour}:${minute}`
      onChange?.(newTime)
      setOpen(false)
    }
  }

  const displayValue = value 
    ? value.slice(0, 5) 
    : undefined

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full justify-start text-left font-normal h-10",
            !displayValue && "text-muted-foreground",
            className
          )}
        >
          <Clock className="mr-2 h-4 w-4" />
          {displayValue || <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="flex pointer-events-auto">
          <div className="border-r">
            <div className="px-3 py-2 text-sm font-medium text-center border-b bg-muted">
              Heure
            </div>
            <ScrollArea className="h-[200px]">
              <div className="p-1">
                {hours.map((hour) => (
                  <Button
                    key={hour}
                    variant={selectedHour === hour ? "default" : "ghost"}
                    className="w-full justify-center px-3 py-1.5 text-sm"
                    onClick={() => handleHourSelect(hour)}
                  >
                    {hour}
                  </Button>
                ))}
              </div>
            </ScrollArea>
          </div>
          <div>
            <div className="px-3 py-2 text-sm font-medium text-center border-b bg-muted">
              Min
            </div>
            <ScrollArea className="h-[200px]">
              <div className="p-1">
                {minutes.map((minute) => (
                  <Button
                    key={minute}
                    variant={selectedMinute === minute ? "default" : "ghost"}
                    className="w-full justify-center px-3 py-1.5 text-sm"
                    onClick={() => handleMinuteSelect(minute)}
                  >
                    {minute}
                  </Button>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
