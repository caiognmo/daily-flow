'use client';

import { useRef, useState } from 'react';
import { format, isValid, parseISO } from 'date-fns';
import { ptBR } from 'react-day-picker/locale';
import { CalendarDays } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTitle,
  PopoverTrigger,
} from '@/components/ui/popover';

/** Keep direct date typing and provide a picker independent of browser UI. */
export function DateField({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const parsed = value ? parseISO(value) : undefined;
  const selected = parsed && isValid(parsed) ? parsed : undefined;
  const selectDate = (date?: Date) => {
    onChange(date ? format(date, 'yyyy-MM-dd') : '');
    setOpen(false);
  };

  return (
    <div className="daily-date-field">
      <Input
        ref={inputRef}
        id={id}
        type="date"
        className="input daily-date-input"
        aria-label={label}
        aria-keyshortcuts="Enter Alt+ArrowDown"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (
            !event.nativeEvent.isComposing &&
            !event.repeat &&
            !event.ctrlKey &&
            !event.metaKey &&
            !event.shiftKey &&
            ((event.key === 'Enter' && !event.altKey) ||
              (event.key === 'ArrowDown' && event.altKey))
          ) {
            event.preventDefault();
            setOpen(true);
          }
        }}
      />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          type="button"
          className="calendar-trigger"
          aria-label={`Abrir calendário: ${label}`}
          title="Abrir calendário"
        >
          <CalendarDays aria-hidden="true" />
        </PopoverTrigger>
        <PopoverContent
          ref={popupRef}
          className="daily-date-popover"
          align="end"
          sideOffset={8}
          initialFocus={() =>
            popupRef.current?.querySelector<HTMLElement>(
              '.daily-calendar button[tabindex="0"]',
            ) ?? true
          }
          finalFocus={inputRef}
        >
          <PopoverTitle className="daily-calendar-title">{label}</PopoverTitle>
          <Calendar
            className="daily-calendar"
            mode="single"
            locale={ptBR}
            selected={selected}
            defaultMonth={selected}
            required
            onSelect={selectDate}
            labels={{
              labelNext: () => 'Próximo mês',
              labelPrevious: () => 'Mês anterior',
              labelGrid: (date) =>
                format(date, "MMMM 'de' yyyy", { locale: ptBR }),
              labelDayButton: (date, modifiers) =>
                `${format(date, "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })}${modifiers.today ? ', hoje' : ''}${modifiers.selected ? ', selecionado' : ''}`,
            }}
          />
          <div className="daily-calendar-actions">
            <button type="button" onClick={() => selectDate(new Date())}>
              Hoje
            </button>
            <button type="button" onClick={() => selectDate()}>
              Limpar data
            </button>
          </div>
          <p className="daily-calendar-help">
            Setas para navegar · Enter para selecionar · Esc para fechar
          </p>
        </PopoverContent>
      </Popover>
    </div>
  );
}
