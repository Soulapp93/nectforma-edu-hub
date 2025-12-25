import * as React from "react"
import { format, parse, isValid } from "date-fns"
import { fr } from "date-fns/locale"
import { CalendarIcon, Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"

interface DateTimePickerProps {
  value?: string // Format: "YYYY-MM-DDTHH:mm"
  onChange?: (value: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  id?: string
  minDate?: Date
}

const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'))
const minutes = ['00', '15', '30', '45']

export function DateTimePicker({
  value,
  onChange,
  placeholder = "Sélectionner date et heure",
  className,
  disabled,
  id,
  minDate
}: DateTimePickerProps) {
  const [open, setOpen] = React.useState(false)
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>()
  const [selectedHour, setSelectedHour] = React.useState<string>('09')
  const [selectedMinute, setSelectedMinute] = React.useState<string>('00')

  React.useEffect(() => {
    if (value) {
      const parsed = parse(value, "yyyy-MM-dd'T'HH:mm", new Date())
      if (isValid(parsed)) {
        setSelectedDate(parsed)
        setSelectedHour(format(parsed, 'HH'))
        setSelectedMinute(format(parsed, 'mm'))
      }
    }
  }, [value])

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date)
    if (date) {
      const dateStr = format(date, 'yyyy-MM-dd')
      const newValue = `${dateStr}T${selectedHour}:${selectedMinute}`
      onChange?.(newValue)
    }
  }

  const handleHourSelect = (hour: string) => {
    setSelectedHour(hour)
    if (selectedDate) {
      const dateStr = format(selectedDate, 'yyyy-MM-dd')
      const newValue = `${dateStr}T${hour}:${selectedMinute}`
      onChange?.(newValue)
    }
  }

  const handleMinuteSelect = (minute: string) => {
    setSelectedMinute(minute)
    if (selectedDate) {
      const dateStr = format(selectedDate, 'yyyy-MM-dd')
      const newValue = `${dateStr}T${selectedHour}:${minute}`
      onChange?.(newValue)
      setOpen(false)
    }
  }

  const displayValue = value && selectedDate && isValid(selectedDate)
    ? format(selectedDate, "d MMMM yyyy 'à' HH:mm", { locale: fr })
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
          <CalendarIcon className="mr-2 h-4 w-4" />
          {displayValue || <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="flex flex-col sm:flex-row pointer-events-auto">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleDateSelect}
            disabled={(date) => minDate ? date < minDate : false}
            initialFocus
            locale={fr}
            className="p-3 pointer-events-auto"
          />
          <div className="flex border-t sm:border-t-0 sm:border-l">
            <div className="border-r">
              <div className="px-3 py-2 text-sm font-medium text-center border-b bg-muted flex items-center gap-1">
                <Clock className="h-3 w-3" />
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
        </div>
      </PopoverContent>
    </Popover>
  )
}
