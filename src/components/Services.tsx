import React from 'react';
import { ServicePackage } from '../types';
import { Camera, Heart, Image as ImageIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const Services: React.FC = () => {
  const { t } = useTranslation();

  const businessPhone = (import.meta as any).env?.VITE_WHATSAPP_BUSINESS_PHONE as string | undefined;

  const openWhatsApp = (message: string) => {
    // click-to-chat: sends from the client's WhatsApp account (client number)
    if (!businessPhone) {
      alert(
        "VITE_WHATSAPP_BUSINESS_PHONE n'est pas configuré. Ajoutez-le dans vos variables d'environnement Vite (.env / Vercel)."
      );
      return;
    }
    const cleaned = businessPhone.replace(/\s+/g, '').replace(/^\+/, '');
    const url = `https://wa.me/${cleaned}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const PACKAGES: ServicePackage[] = [
    {
      id: 'photo',
      title: t('services.packages.photo.title'),
      description: t('services.packages.photo.description'),
      features: t('services.packages.photo.features', { returnObjects: true }) as string[]
    },
    {
      id: 'photo-video',
      title: t('services.packages.photoVideo.title'),
      description: t('services.packages.photoVideo.description'),
      features: t('services.packages.photoVideo.features', { returnObjects: true }) as string[]
    },
    {
      id: 'extras',
      title: t('services.packages.extras.title'),
      description: t('services.packages.extras.description'),
      features: t('services.packages.extras.features', { returnObjects: true }) as string[]
    }
  ];

  return (
    <section id="services" className="py-24 bg-white px-4 md:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-bold tracking-[0.2em] text-stone-500 uppercase">
            {t('services.badge')}
          </span>
          <h3 className="font-serif text-4xl md:text-5xl text-stone-900 mt-4 mb-6">
            {t('services.title')}
          </h3>
          <p className="text-stone-600 font-light leading-relaxed">
            {t('services.subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {PACKAGES.map((pkg, index) => (
            <div
              key={pkg.id}
              className={`p-8 border ${
                index === 1 ? 'border-stone-800 bg-stone-50' : 'border-stone-200'
              } flex flex-col items-center text-center transition-all hover:shadow-xl duration-300`}
            >
              <div className="mb-6 text-stone-800">
                {index === 0 && <Camera strokeWidth={1} size={32} />}
                {index === 1 && <Heart strokeWidth={1} size={32} />}
                {index === 2 && <ImageIcon strokeWidth={1} size={32} />}
              </div>

              <h4 className="font-serif text-2xl mb-4">{pkg.title}</h4>

              <p className="text-stone-500 text-sm mb-8 leading-relaxed px-4">
                {pkg.description}
              </p>

              <ul className="space-y-3 mb-10 flex-grow">
                {pkg.features.map((feature, i) => (
                  <li
                    key={i}
                    className="text-sm text-stone-600 font-light flex items-center justify-center gap-2"
                  >
                    <span className="w-1 h-1 bg-stone-400 rounded-full" />
                    {feature}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => {
                  const msg =
                    `Bonjour, je souhaite demander des informations sur l'offre : ${pkg.title}. ` +
                    `Pouvez-vous me donner les détails et la disponibilité, s'il vous plaît ?`;
                  openWhatsApp(msg);
                }}
                className={`px-6 py-2 text-sm uppercase tracking-wider transition-colors ${
                  index === 1
                    ? 'bg-stone-800 text-white hover:bg-stone-700'
                    : 'border border-stone-800 text-stone-800 hover:bg-stone-800 hover:text-white'
                }`}
              >
                {t('services.cta')}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
