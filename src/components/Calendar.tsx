import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { api } from '../services/api';

interface CalendarProps {
  onDateSelect: (date: string) => void;
}

export const Calendar: React.FC<CalendarProps> = ({ onDateSelect }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [bookedDates, setBookedDates] = useState<string[]>([]);

  // 🔒 Normalize "today" (midnight)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  useEffect(() => {
    const loadDates = async () => {
      const dates = await api.getBookedDates();
      setBookedDates(dates);
    };
    loadDates();
  }, [currentDate]);

  const daysInMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    0
  ).getDate();

  const firstDayOfMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    1
  ).getDay();

  const handlePrevMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
    );
  };

  const handleNextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
    );
  };

  const handleDateClick = (day: number) => {
    const clickedDate = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      day
    );
    clickedDate.setHours(0, 0, 0, 0);

    // ❌ Block past dates
    if (clickedDate < today) return;

    const dateString = `${currentDate.getFullYear()}-${String(
      currentDate.getMonth() + 1
    ).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    // ❌ Block already booked dates
    if (bookedDates.includes(dateString)) return;

    setSelectedDate(dateString);
    onDateSelect(dateString);
  };

  const renderDays = () => {
    const days = [];

    // Empty cells before the 1st
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="h-10 w-10" />);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateObj = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        day
      );
      dateObj.setHours(0, 0, 0, 0);

      const dateString = `${currentDate.getFullYear()}-${String(
        currentDate.getMonth() + 1
      ).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

      const isPast = dateObj < today;
      const isBooked = bookedDates.includes(dateString);
      const isSelected = selectedDate === dateString;

      const isDisabled = isPast || isBooked;

      days.push(
        <button
          key={day}
          disabled={isDisabled}
          onClick={() => handleDateClick(day)}
          className={`h-10 w-10 rounded-full flex items-center justify-center text-sm transition-all duration-300
            ${isSelected ? 'bg-stone-800 text-white' : ''}
            ${
              isDisabled
                ? 'bg-stone-200 text-stone-400 cursor-not-allowed line-through'
                : 'hover:bg-champagne-200 text-stone-800'
            }
          `}
        >
          {day}
        </button>
      );
    }

    return days;
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

  return (
    <div className="bg-stone-50 p-6 rounded-lg border border-stone-200">
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={handlePrevMonth}
          className="p-1 hover:bg-stone-200 rounded-full transition-colors"
        >
          <ChevronLeft size={20} className="text-stone-600" />
        </button>

        <span className="font-serif text-xl text-stone-800">
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </span>

        <button
          onClick={handleNextMonth}
          className="p-1 hover:bg-stone-200 rounded-full transition-colors"
        >
          <ChevronRight size={20} className="text-stone-600" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d) => (
          <div
            key={d}
            className="h-8 flex items-center justify-center text-xs font-bold text-stone-400"
          >
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">{renderDays()}</div>

      <div className="mt-6 flex gap-4 text-xs text-stone-500 justify-center">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-stone-200 rounded-full" /> Indisponible
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 border border-stone-800 rounded-full" /> Disponible
        </div>
      </div>
    </div>
  );
};
