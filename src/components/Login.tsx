// src/components/Login.tsx
import React, { useMemo, useState } from 'react';
import { api } from '../services/api';
import { User } from '../types';
import { Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface LoginProps {
  onLogin: (user: User) => void;
  onBack: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin, onBack }) => {
  const { t } = useTranslation();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const trimmed = identifier.trim();

  const isEmail = useMemo(() => trimmed.includes('@'), [trimmed]);
  const isCode = useMemo(() => /^\d{6}$/.test(trimmed), [trimmed]);

  const canSubmit = isEmail ? password.trim().length > 0 : isCode;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (isEmail) {
        // ✅ You must implement api.loginStaffOrAdmin(email, password) in src/services/api.ts
        const user = await api.loginStaffOrAdmin(trimmed, password);
        if (user) onLogin(user);
        else setError(t('login.admin.error'));
        return;
      }

      if (isCode) {
        const user = await api.loginClient(trimmed);
        if (user) onLogin(user);
        else setError(t('login.client.error'));
        return;
      }

      setError(t('login.unified.invalidIdentifier'));
    } catch (err) {
      console.error(err);
      setError(t('login.unified.failed'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 md:p-12 shadow-xl max-w-md w-full relative">
        <button onClick={onBack} className="absolute top-4 right-4 text-stone-400 hover:text-stone-800">
          {t('login.close')}
        </button>

        <div className="text-center mb-8">
          <h2 className="font-serif text-4xl text-stone-900 mb-2">{t('login.brand')}</h2>
          <p className="text-xs uppercase tracking-[0.2em] text-stone-500">
            {t('login.unified.subtitle')}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-800 text-xs border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-1">
            <label className="text-xs uppercase tracking-wide text-stone-500">
              {t('login.unified.identifierLabel')}
            </label>

            <input
              type="text"
              autoFocus
              value={identifier}
              onChange={(e) => {
                setIdentifier(e.target.value);
                setError('');
                // If user switches from email -> code, clear password
                if (!e.target.value.includes('@')) setPassword('');
              }}
              className={`w-full border-b border-stone-300 py-3 focus:outline-none focus:border-stone-800 transition-colors bg-transparent placeholder-stone-200 ${
                isCode ? 'text-center text-2xl font-serif tracking-widest' : ''
              }`}
              placeholder={t('login.unified.identifierPlaceholder')}
              maxLength={isCode ? 6 : 80}
              inputMode={isCode ? 'numeric' : 'text'}
            />

            <p className="text-[10px] text-stone-400 text-center mt-2">
              {t('login.unified.hint')}
            </p>
          </div>

          {/* Password only for email */}
          {isEmail && (
            <div className="space-y-1">
              <label className="text-xs uppercase tracking-wide text-stone-500">
                {t('login.admin.password')}
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                className="w-full border-b border-stone-300 py-2 focus:outline-none focus:border-stone-800 transition-colors bg-transparent"
                placeholder="••••••••"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || !canSubmit}
            className="w-full bg-stone-900 text-white py-3 uppercase tracking-widest text-xs hover:bg-stone-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? <Loader2 className="animate-spin" size={16} /> : t('login.unified.cta')}
          </button>
        </form>

        <div className="mt-8 text-center text-xs text-stone-400 leading-relaxed border-t border-stone-100 pt-4">
          <p>{t('login.unified.help.clients')}</p>
          <p>{t('login.unified.help.staff')}</p>

          {/* keep your demo text if you still want it */}
          <div className="mt-3">
            <p>{t('login.demo.admin', { email: 'admin@souli.com' })}</p>
            <p>{t('login.demo.client', { code: '123456' })}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
