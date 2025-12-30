import React, { useEffect, useMemo, useState } from 'react';
import { GalleryItem } from '../types';
import { api } from '../services/api';
import { X, ChevronLeft, ChevronRight, Maximize2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const Portfolio: React.FC = () => {
  const { t } = useTranslation();

  const [items, setItems] = useState<GalleryItem[]>([]);
  const [isFullView, setIsFullView] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    const fetchPortfolio = async () => {
      try {
        const photos = await api.getPublicPhotos();
        setItems(photos);
      } catch (e) {
        console.error('Failed to load public portfolio photos', e);
        setItems([]);
      }
    };
    fetchPortfolio();
  }, []);

  const displayItems = useMemo(
    () => (isFullView ? items : items.slice(0, 6)),
    [isFullView, items]
  );

  const selectedIndex = useMemo(() => {
    if (!selectedId) return null;
    const idx = items.findIndex(p => p.id === selectedId);
    return idx >= 0 ? idx : null;
  }, [items, selectedId]);

  const openLightbox = (id: string) => setSelectedId(id);
  const closeLightbox = () => setSelectedId(null);

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedIndex === null || items.length === 0) return;
    const next = (selectedIndex + 1) % items.length;
    setSelectedId(items[next].id);
  };

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedIndex === null || items.length === 0) return;
    const prev = (selectedIndex - 1 + items.length) % items.length;
    setSelectedId(items[prev].id);
  };

  return (
    <section id="portfolio" className="py-24 bg-stone-50 px-4 md:px-8 relative">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h3 className="font-serif text-4xl md:text-5xl text-stone-900 mb-4">{t('portfolio.title')}</h3>
          <p className="text-stone-500 font-light max-w-2xl mx-auto">
            {t('portfolio.subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
          {displayItems.map(item => (
            <div
              key={item.id}
              onClick={() => openLightbox(item.id)}
              className="group relative aspect-[3/4] overflow-hidden bg-stone-200 cursor-pointer"
            >
              <img
                src={item.url}
                alt={item.title}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-stone-900/0 group-hover:bg-stone-900/20 transition-colors duration-500 flex items-center justify-center">
                <span className="text-white opacity-0 group-hover:opacity-100 font-serif tracking-wide transition-opacity duration-300 flex items-center gap-2">
                  <Maximize2 size={16} /> {t('portfolio.view')}
                </span>
              </div>
            </div>
          ))}

          {items.length === 0 && (
            <div className="col-span-full text-center py-12 text-stone-400">
              {t('portfolio.empty')}
            </div>
          )}
        </div>

        <div className="text-center mt-12">
          {items.length > 6 && !isFullView && (
            <button
              onClick={() => setIsFullView(true)}
              className="inline-block border-b border-stone-800 pb-1 text-stone-800 hover:text-stone-500 transition-colors uppercase tracking-widest text-xs"
            >
              {t('portfolio.viewFull')}
            </button>
          )}
          {isFullView && (
            <button
              onClick={() => setIsFullView(false)}
              className="inline-block border-b border-stone-800 pb-1 text-stone-800 hover:text-stone-500 transition-colors uppercase tracking-widest text-xs"
            >
              {t('portfolio.showLess')}
            </button>
          )}
        </div>
      </div>

      {selectedIndex !== null && items[selectedIndex] && (
        <div
          className="fixed inset-0 z-50 bg-stone-900/95 flex items-center justify-center backdrop-blur-sm animate-fade-in"
          onClick={closeLightbox}
        >
          <button
            className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors"
            onClick={closeLightbox}
          >
            <X size={32} strokeWidth={1} />
          </button>

          <button
            className="absolute left-4 text-white/50 hover:text-white transition-colors p-4 hidden md:block"
            onClick={prevImage}
          >
            <ChevronLeft size={48} strokeWidth={1} />
          </button>

          <div className="max-w-5xl max-h-[85vh] p-4 relative" onClick={e => e.stopPropagation()}>
            <img
              src={items[selectedIndex].url}
              alt={items[selectedIndex].title}
              className="max-h-[85vh] w-auto max-w-full object-contain shadow-2xl"
            />
            <div className="text-center mt-4 text-white/80 font-serif tracking-wide">
              {items[selectedIndex].title}
            </div>
          </div>

          <button
            className="absolute right-4 text-white/50 hover:text-white transition-colors p-4 hidden md:block"
            onClick={nextImage}
          >
            <ChevronRight size={48} strokeWidth={1} />
          </button>
        </div>
      )}
    </section>
  );
};
