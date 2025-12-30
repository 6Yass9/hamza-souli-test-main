// src/App.tsx
import React, { useEffect, useState } from 'react';

import { Hero } from './components/Hero';
import { Services } from './components/Services';
import { Portfolio } from './components/Portfolio';
import { Contact } from './components/Contact';
import { Login } from './components/Login';

// IMPORTANT:
// Your file is: src/components/admindashboard.tsx
// So the import MUST match the exact casing/path:
import { AdminDashboard } from './components/AdminDashboard';

import { ClientDashboard } from './components/ClientDashboard';
import { StaffDashboard } from './components/StaffDashboard';

import { User } from './types';
import { Menu, X, Instagram, Facebook, MessageCircle, User as UserIcon } from 'lucide-react';

import { useTranslation } from 'react-i18next';
import { setLanguage } from './i18n';

const App: React.FC = () => {
  const { t, i18n } = useTranslation();

  const [view, setView] = useState<'home' | 'login' | 'admin' | 'client' | 'staff'>('home');
  const [user, setUser] = useState<User | null>(null);

  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // ensure correct dir/lang on load
  useEffect(() => {
    const dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.dir = dir;
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    if (view !== 'home') {
      setView('home');
      setTimeout(() => {
        const element = document.getElementById(id);
        if (element) element.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      const element = document.getElementById(id);
      if (element) element.scrollIntoView({ behavior: 'smooth' });
    }
    setMobileMenuOpen(false);
  };

  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);

    if (loggedInUser.role === 'admin') {
      setView('admin');
      return;
    }

    if (loggedInUser.role === 'staff') {
      setView('staff');
      return;
    }

    setView('client');
  };

  const handleLogout = () => {
    setUser(null);
    setMobileMenuOpen(false);
    setView('home');
  };

  // Dashboard routes
  if (view === 'admin') return <AdminDashboard onLogout={handleLogout} />;
  if (view === 'staff' && user) return <StaffDashboard user={user} onLogout={handleLogout} />;
  if (view === 'client' && user) return <ClientDashboard user={user} onLogout={handleLogout} />;
  if (view === 'login') return <Login onLogin={handleLogin} onBack={() => setView('home')} />;

  // Public site
  const navLinks = [
    { name: t('nav.home'), id: 'home' },
    { name: t('nav.portfolio'), id: 'portfolio' },
    { name: t('nav.services'), id: 'services' },
    { name: t('nav.contact'), id: 'contact' }
  ];

  return (
    <main className="min-h-screen relative selection:bg-stone-200">
      {/* Navigation */}
      <nav
        className={`fixed top-0 w-full z-40 transition-all duration-500 ${
          isScrolled ? 'bg-white/95 backdrop-blur-sm text-stone-800 shadow-sm py-4' : 'bg-transparent text-white py-6'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          <div
            className="font-serif text-2xl md:text-3xl tracking-wide cursor-pointer z-50"
            onClick={() => scrollToSection('home')}
          >
            HAMZA SOULI
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex gap-8 items-center">
            {navLinks.map(link => (
              <button
                key={link.id}
                onClick={() => scrollToSection(link.id)}
                className="text-sm uppercase tracking-widest hover:opacity-70 transition-opacity relative group"
              >
                {link.name}
                <span
                  className={`absolute -bottom-2 left-0 w-0 h-px transition-all duration-300 group-hover:w-full ${
                    isScrolled ? 'bg-stone-800' : 'bg-white'
                  }`}
                />
              </button>
            ))}

            {/* Language Switch */}
            <div className="flex items-center gap-2 ml-2">
              {(['en', 'fr', 'ar'] as const).map(lng => (
                <button
                  key={lng}
                  onClick={() => setLanguage(lng)}
                  className={`text-xs uppercase tracking-widest px-2 py-1 rounded border ${
                    i18n.language === lng
                      ? isScrolled
                        ? 'border-stone-800 text-stone-900'
                        : 'border-white text-white'
                      : isScrolled
                      ? 'border-stone-200 text-stone-500 hover:text-stone-800'
                      : 'border-white/30 text-white/80 hover:text-white'
                  }`}
                >
                  {lng}
                </button>
              ))}
            </div>

            <button
              onClick={() => setView('login')}
              className={`ml-2 p-2 rounded-full transition-colors ${isScrolled ? 'hover:bg-stone-100' : 'hover:bg-white/20'}`}
              title={t('nav.clientLogin')}
            >
              <UserIcon size={20} />
            </button>
          </div>

          {/* Mobile Menu Toggle */}
          <div className="flex md:hidden gap-4 items-center z-50">
            <button onClick={() => setView('login')} className={mobileMenuOpen ? 'text-stone-900' : 'text-current'}>
              <UserIcon size={20} />
            </button>
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X size={24} className="text-stone-900" /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <div
        className={`fixed inset-0 z-40 bg-white transform transition-transform duration-500 ease-in-out ${
          mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        } md:hidden flex flex-col justify-center items-center gap-8`}
      >
        {navLinks.map(link => (
          <button
            key={link.id}
            onClick={() => scrollToSection(link.id)}
            className="font-serif text-4xl text-stone-900 hover:text-stone-600"
          >
            {link.name}
          </button>
        ))}

        <div className="flex items-center gap-3 mt-8">
          {(['en', 'fr', 'ar'] as const).map(lng => (
            <button
              key={lng}
              onClick={() => setLanguage(lng)}
              className={`text-xs uppercase tracking-widest px-3 py-2 rounded border ${
                i18n.language === lng ? 'border-stone-900 text-stone-900' : 'border-stone-200 text-stone-500'
              }`}
            >
              {lng}
            </button>
          ))}
        </div>
      </div>

      <Hero scrollToSection={scrollToSection} />
      <Services />
      <Portfolio />

      {/* Divider */}
      <section className="py-20 bg-stone-900 text-stone-100 text-center px-4">
        <div className="max-w-3xl mx-auto">
          <p className="font-serif text-2xl md:text-3xl italic leading-relaxed mb-6"></p>
          <p className="text-xs uppercase tracking-widest text-stone-400"></p>
        </div>
      </section>

      <Contact />

      <footer className="bg-stone-900 text-stone-400 py-12 px-6 border-t border-stone-800">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-center md:text-left">
            <h5 className="font-serif text-xl text-white mb-2">{t('footer.brand')}</h5>
            <p className="text-sm font-light">{t('footer.tagline')}</p>
          </div>

          <div className="flex gap-6">
            <a
              href="https://www.instagram.com/hamza_souli_photographe_?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw=="
              className="hover:text-white transition-colors"
              aria-label="Instagram"
            >
              <Instagram size={20} />
            </a>
            <a
              href="https://www.facebook.com/profile.php?id=100086699424290"
              className="hover:text-white transition-colors"
              aria-label="Facebook"
            >
              <Facebook size={20} />
            </a>
            <a
              href="https://wa.me/21621422167"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors"
              aria-label="WhatsApp"
            >
              <MessageCircle size={20} />
            </a>
          </div>

          <div className="text-xs font-light text-center md:text-right">
            &copy; {new Date().getFullYear()} {t('footer.brand')}. {t('footer.rights')}
          </div>
        </div>
      </footer>
    </main>
  );
};

export default App;
