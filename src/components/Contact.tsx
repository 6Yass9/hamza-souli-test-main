import React, { useState } from 'react';
import { Calendar } from './Calendar';
import { api } from '../services/api';
import { useTranslation } from 'react-i18next';

export const Contact: React.FC = () => {
  const { t } = useTranslation();

  const [activeTab, setActiveTab] = useState<'message' | 'book'>('book');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [bookingName, setBookingName] = useState('');
  const [bookingPhone, setBookingPhone] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isValidPhone = (phone: string) => {
    const cleaned = phone.replace(/\s/g, '');
    return /^(\+?\d{8,15})$/.test(cleaned);
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedDate || !bookingName || !bookingPhone) {
      setError(t('contact.booking.errors.required'));
      return;
    }

    if (!isValidPhone(bookingPhone)) {
      setError(t('contact.booking.errors.invalidPhone'));
      return;
    }

    try {
      setLoading(true);

      // 1️⃣ Create appointment
      await api.createAppointment(selectedDate, bookingName, bookingPhone);

      // 2️⃣ Notify admin (non-blocking)
      fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: selectedDate,
          name: bookingName,
          phone: bookingPhone
        })
      }).catch((err) => {
        console.error('Notification failed', err);
      });

      alert(t('contact.booking.success'));
      setBookingName('');
      setBookingPhone('');
      setSelectedDate(null);
    } catch (err) {
      console.error(err);
      setError(t('contact.booking.errors.generic'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="contact" className="py-24 bg-stone-100 px-4">
      <div className="max-w-5xl mx-auto bg-white shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[600px]">
        <div className="hidden md:block w-1/3 bg-stone-800 relative">
          <img
            src="https://images.unsplash.com/photo-1537633552985-df8429e8048b?q=80&w=1887&auto=format&fit=crop"
            alt="Bride holding flowers"
            className="absolute inset-0 w-full h-full object-cover opacity-80"
          />
          <div className="absolute inset-0 bg-stone-900/30" />
          <div className="relative z-10 p-8 h-full flex flex-col justify-end text-white">
            <h4 className="font-serif text-3xl mb-2">{t('contact.imageTitle')}</h4>
            <p className="font-light text-sm text-stone-200">
              {t('contact.imageSubtitle')}
            </p>
          </div>
        </div>

        <div className="w-full md:w-2/3 p-8 md:p-12">
          <div className="flex border-b border-stone-200 mb-8">
            <button
              onClick={() => setActiveTab('book')}
              className={`pb-4 px-4 text-sm uppercase tracking-widest transition-all ${
                activeTab === 'book'
                  ? 'border-b-2 border-stone-800 text-stone-900'
                  : 'text-stone-400 hover:text-stone-600'
              }`}
            >
              {t('contact.tabs.book')}
            </button>

            <button
              onClick={() => setActiveTab('message')}
              className={`pb-4 px-4 text-sm uppercase tracking-widest transition-all ${
                activeTab === 'message'
                  ? 'border-b-2 border-stone-800 text-stone-900'
                  : 'text-stone-400 hover:text-stone-600'
              }`}
            >
              {t('contact.tabs.message')}
            </button>
          </div>

          {activeTab === 'book' ? (
            <div className="fade-enter-active flex flex-col md:flex-row gap-8">
              <div className="flex-1">
                <div className="mb-6">
                  <h3 className="font-serif text-3xl text-stone-900 mb-2">
                    {t('contact.booking.title')}
                  </h3>
                  <p className="text-stone-500 font-light text-sm">
                    {t('contact.booking.subtitle')}
                  </p>
                </div>
                <Calendar onDateSelect={setSelectedDate} />
              </div>

              <div className="flex-1 flex flex-col justify-center">
                {selectedDate ? (
                  <form
                    onSubmit={handleBookingSubmit}
                    className="bg-stone-50 p-6 rounded border border-stone-200"
                  >
                    <h4 className="font-serif text-xl mb-4 text-stone-800">
                      {t('contact.booking.confirmTitle')}
                    </h4>

                    <p className="text-sm text-stone-600 mb-4">
                      {t('contact.booking.dateLabel')}{' '}
                      <span className="font-bold">{selectedDate}</span>
                    </p>

                    <div className="space-y-4">
                      <input
                        type="text"
                        required
                        value={bookingName}
                        onChange={(e) => setBookingName(e.target.value)}
                        className="w-full p-2 border border-stone-300 rounded text-sm bg-white"
                        placeholder={t('contact.booking.yourName')}
                      />

                      <input
                        type="tel"
                        required
                        value={bookingPhone}
                        onChange={(e) => setBookingPhone(e.target.value)}
                        className="w-full p-2 border border-stone-300 rounded text-sm bg-white"
                        placeholder={t('contact.booking.yourPhone')}
                      />

                      {error && (
                        <p className="text-sm text-red-600">{error}</p>
                      )}

                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-stone-800 text-white py-2 text-sm uppercase tracking-wider hover:bg-stone-700 disabled:opacity-50"
                      >
                        {loading ? '...' : t('contact.booking.cta')}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="h-full flex items-center justify-center text-stone-400 text-sm italic border-2 border-dashed border-stone-200 rounded p-8 text-center">
                    {t('contact.booking.empty')}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="fade-enter-active">
              <div className="mb-8">
                <h3 className="font-serif text-3xl text-stone-900 mb-2">
                  {t('contact.message.title')}
                </h3>
              </div>

              <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
                {/* inquiry form unchanged */}
              </form>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
