import React from 'react';
import { ArrowDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface HeroProps {
  scrollToSection: (id: string) => void;
}

export const Hero: React.FC<HeroProps> = ({ scrollToSection }) => {
  const { t } = useTranslation();

  return (
    <section id="home" className="relative h-screen w-full overflow-hidden flex items-center justify-center text-center">
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=2070&auto=format&fit=crop"
          alt="Wedding couple holding hands"
          className="w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-stone-900/40" />
      </div>

      <div className="relative z-10 px-4 max-w-4xl mx-auto text-white fade-enter-active">
        <h2 className="text-sm md:text-base tracking-[0.2em] uppercase mb-4 text-stone-200">
          {t('hero.tagline')}
        </h2>

        <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl mb-6 leading-tight">
          HAMZA SOULI
        </h1>

        <p className="text-stone-100 text-lg md:text-xl font-light mb-10 max-w-2xl mx-auto">
          {t('hero.subtitle')}
        </p>

        <button
          onClick={() => scrollToSection('portfolio')}
          className="px-8 py-3 border border-white text-white hover:bg-white hover:text-stone-900 transition-all duration-300 tracking-wide uppercase text-sm"
        >
          {t('hero.cta')}
        </button>
      </div>

      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10 animate-bounce">
        <button onClick={() => scrollToSection('services')} className="text-white/80 hover:text-white" aria-label="Scroll">
          <ArrowDown size={32} strokeWidth={1} />
        </button>
      </div>
    </section>
  );
};
