import React, { useEffect, useMemo, useState } from 'react';
import { User, Appointment } from '../types';
import { api } from '../services/api';
import { Calendar as CalendarIcon, LogOut, Clock, MapPin, ExternalLink, CalendarDays } from 'lucide-react';
import { Calendar } from './Calendar';

interface StaffDashboardProps {
  user: User;
  onLogout: () => void;
}

export const StaffDashboard: React.FC<StaffDashboardProps> = ({ user, onLogout }) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  useEffect(() => {
    const fetchAssigned = async () => {
      // Uses the API helper that already filters by user_id
      const assigned = await api.getStaffAppointments(user.id);
      setAppointments(assigned);
    };
    fetchAssigned();
  }, [user.id]);

  const appointmentsOnSelectedDate = useMemo(() => {
    if (!selectedDate) return [];
    return appointments.filter(a => a.date === selectedDate);
  }, [appointments, selectedDate]);

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-900 transition-colors duration-300">
      {/* Header */}
      <header className="bg-white dark:bg-stone-800 border-b border-stone-200 dark:border-stone-700 px-8 py-4 flex justify-between items-center sticky top-0 z-30 transition-colors">
        <div className="flex items-center gap-4">
          <img src="/logo.png" alt="Hamza Souli" className="h-6 w-auto brightness-0 dark:brightness-100" />
          <span className="text-stone-400 dark:text-stone-500 font-sans text-xs uppercase tracking-wide border-l border-stone-200 dark:border-stone-700 pl-4">
            Staff Portal
          </span>
        </div>

        <div className="flex items-center gap-6">
          <span className="text-sm font-medium text-stone-600 dark:text-stone-300 hidden md:inline">
            Logged in as {user.name}
          </span>
          <button
            onClick={onLogout}
            className="flex items-center gap-2 text-xs uppercase tracking-widest text-stone-500 hover:text-stone-800 dark:hover:text-stone-100 transition-colors"
          >
            <LogOut size={16} /> Logout
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Calendar View */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white dark:bg-stone-800 p-6 shadow-sm border border-stone-100 dark:border-stone-700 rounded-lg">
              <h3 className="font-serif text-2xl mb-6 flex items-center gap-2 text-stone-800 dark:text-stone-100">
                <CalendarDays size={20} className="text-stone-400" />
                My Schedule
              </h3>

              <Calendar onDateSelect={setSelectedDate} />
            </div>

            <div className="bg-stone-800 text-white p-6 rounded-lg shadow-lg">
              <h4 className="text-xs uppercase tracking-widest opacity-60 mb-2">Total Assignments</h4>
              <div className="text-3xl font-serif">{appointments.length} Events</div>
            </div>
          </div>

          {/* Schedule Detail Area */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-stone-800 shadow-sm border border-stone-100 dark:border-stone-700 rounded-lg h-full min-h-[500px]">
              <div className="p-6 border-b border-stone-100 dark:border-stone-700 flex justify-between items-center">
                <h2 className="font-serif text-2xl text-stone-800 dark:text-stone-100">
                  {selectedDate ? `Schedule for ${selectedDate}` : 'Upcoming Events'}
                </h2>
              </div>

              <div className="p-6">
                {appointmentsOnSelectedDate.length > 0 ? (
                  <div className="space-y-4">
                    {appointmentsOnSelectedDate.map(app => (
                      <div
                        key={app.id}
                        className="p-6 border border-stone-100 dark:border-stone-700 rounded-lg bg-stone-50 dark:bg-stone-900/40 hover:border-stone-300 dark:hover:border-stone-500 transition-all group"
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <span className="text-[10px] uppercase tracking-widest bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 px-2 py-1 rounded">
                              {app.type}
                            </span>
                            <h3 className="font-serif text-2xl text-stone-900 dark:text-stone-100 mt-2">
                              {app.clientName}
                            </h3>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-stone-500 dark:text-stone-400">
                            <Clock size={14} /> {app.time || '--:--'}
                          </div>
                        </div>

                        <div className="flex flex-col md:flex-row gap-4 md:items-center text-sm text-stone-600 dark:text-stone-400">
                          <div className="flex items-center gap-2">
                            <MapPin size={16} className="text-stone-400" />
                            <span>Location details in Admin notes</span>
                          </div>

                          <button className="md:ml-auto flex items-center gap-2 text-stone-800 dark:text-stone-200 font-bold hover:underline">
                            View Client File <ExternalLink size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 text-stone-400 text-center">
                    <CalendarIcon size={48} className="mb-4 opacity-20" />
                    {selectedDate
                      ? 'No events scheduled for this specific date.'
                      : 'Select a date on the calendar to see your specific assignments.'}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
