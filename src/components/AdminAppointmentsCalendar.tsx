import React, { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Appointment } from '../types';

type Props = {
  appointments: Appointment[]; // expected: confirmed appointments
};

type Category = 'Wedding' | 'Wteya' | 'Reception' | 'Henna' | 'Other';

const categoryFromType = (type?: string): Category => {
  const t = (type || '').toLowerCase();
  if (t.includes('wedding') || t.includes('mariage')) return 'Wedding';
  if (t.includes('wteya') || t.includes('weteya') || t.includes('wteya')) return 'Wteya';
  if (t.includes('reception') || t.includes('réception')) return 'Reception';
  if (t.includes('henna') || t.includes('henné')) return 'Henna';
  return 'Other';
};

const colorClassByCategory: Record<Category, string> = {
  Wedding: 'bg-yellow-500', // Gold
  Wteya: 'bg-gray-400', // Silver
  Reception: 'bg-blue-500', // Blue
  Henna: 'bg-amber-700', // Brown
  Other: 'bg-red-500' // Red
};

const monthNames = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December'
];

export const AdminAppointmentsCalendar: React.FC<Props> = ({ appointments }) => {
  const [currentDate, setCurrentDate] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const byDate = useMemo(() => {
    const map = new Map<string, Appointment[]>();
    for (const a of appointments) {
      if (!a.date) continue;
      const list = map.get(a.date) || [];
      list.push(a);
      map.set(a.date, list);
    }

    // sort each date by time
    for (const [k, list] of map.entries()) {
      list.sort((x, y) => (x.time || '').localeCompare(y.time || ''));
      map.set(k, list);
    }
    return map;
  }, [appointments]);

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    setSelectedDate(null);
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    setSelectedDate(null);
  };

  const dateStringForDay = (day: number) =>
    `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  const renderDays = () => {
    const cells: React.ReactNode[] = [];

    for (let i = 0; i < firstDayOfMonth; i++) {
      cells.push(<div key={`empty-${i}`} className="h-16" />);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = dateStringForDay(day);
      const dayApps = byDate.get(dateStr) || [];

      // unique categories to show dots
      const categories = Array.from(new Set(dayApps.map((a) => categoryFromType(a.type))));
      const isSelected = selectedDate === dateStr;

      cells.push(
        <button
          key={day}
          onClick={() => setSelectedDate(dateStr)}
          className={
            `h-16 rounded-lg border text-left p-2 transition-colors ` +
            (isSelected ? 'border-stone-800 bg-stone-50' : 'border-stone-200 bg-white hover:bg-stone-50')
          }
        >
          <div className="flex items-start justify-between">
            <div className="text-sm font-medium text-stone-800">{day}</div>
            {dayApps.length > 0 && <div className="text-[10px] text-stone-500">{dayApps.length}</div>}
          </div>

          {categories.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {categories.slice(0, 5).map((c) => (
                <span key={c} className={`inline-block w-2.5 h-2.5 rounded-full ${colorClassByCategory[c]}`} title={c} />
              ))}
              {categories.length > 5 && <span className="text-[10px] text-stone-500">+{categories.length - 5}</span>}
            </div>
          )}
        </button>
      );
    }

    return cells;
  };

  const selectedAppointments = selectedDate ? byDate.get(selectedDate) || [] : [];

  return (
    <div className="bg-white border border-stone-200 shadow-sm">
      <div className="p-6 border-b border-stone-100">
        <div className="flex items-center justify-between">
          <div className="text-stone-900 font-serif text-2xl">Calendrier (rendez-vous confirmés)</div>
          <div className="flex items-center gap-2">
            <button onClick={handlePrevMonth} className="p-2 rounded-full hover:bg-stone-100">
              <ChevronLeft size={18} className="text-stone-700" />
            </button>
            <div className="text-sm text-stone-700 min-w-[180px] text-center">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </div>
            <button onClick={handleNextMonth} className="p-2 rounded-full hover:bg-stone-100">
              <ChevronRight size={18} className="text-stone-700" />
            </button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-3 text-xs text-stone-600">
          {(Object.keys(colorClassByCategory) as Category[]).map((c) => (
            <div key={c} className="flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${colorClassByCategory[c]}`} />
              <span>
                {c === 'Wedding' && 'Wedding (Gold)'}
                {c === 'Wteya' && 'Wteya (Silver)'}
                {c === 'Reception' && 'Reception (Blue)'}
                {c === 'Henna' && 'Henna (Brown)'}
                {c === 'Other' && 'Other (Red)'}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-7 gap-2 mb-2">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d) => (
            <div key={d} className="text-[11px] font-semibold text-stone-400 text-center">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-2">{renderDays()}</div>

        <div className="mt-6">
          <div className="text-sm font-semibold text-stone-800 mb-2">
            {selectedDate ? `Détails du ${selectedDate}` : 'Cliquez sur une date pour voir les détails'}
          </div>

          {selectedDate && selectedAppointments.length === 0 && (
            <div className="text-sm text-stone-500">Aucun rendez-vous confirmé ce jour-là.</div>
          )}

          {selectedDate && selectedAppointments.length > 0 && (
            <div className="space-y-2">
              {selectedAppointments.map((a) => {
                const cat = categoryFromType(a.type);
                return (
                  <div key={a.id} className="flex items-center justify-between border border-stone-200 rounded-lg p-3">
                    <div className="flex items-start gap-3">
                      <span className={`w-3 h-3 rounded-full mt-1 ${colorClassByCategory[cat]}`} />
                      <div>
                        <div className="text-sm text-stone-800 font-medium">{a.clientName}</div>
                        <div className="text-xs text-stone-500">{a.type || 'Other'} • {a.time || '—'}</div>
                      </div>
                    </div>
                    <div className="text-xs text-stone-500">#{a.id.slice(0, 6)}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
