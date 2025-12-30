import React, { useEffect, useState } from 'react';
import { User, Appointment, Album, GalleryItem, ClientDocument } from '../types';
import { api } from '../services/api';
import {
  Download,
  Calendar as CalendarIcon,
  LogOut,
  Folder,
  Image,
  ArrowLeft,
  FileText,
  Paperclip
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ClientDashboardProps {
  user: User;
  onLogout: () => void;
}

export const ClientDashboard: React.FC<ClientDashboardProps> = ({ user, onLogout }) => {
  const { t } = useTranslation();

  const [albums, setAlbums] = useState<Album[]>([]);
  const [activeAlbum, setActiveAlbum] = useState<Album | null>(null);
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [review, setReview] = useState('');
  const [documents, setDocuments] = useState<ClientDocument[]>([]);

  const downloadFromUrl = async (url: string, filename: string) => {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Download failed: ${res.status}`);
      const blob = await res.blob();
      const objectUrl = window.URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = objectUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();

      window.URL.revokeObjectURL(objectUrl);
    } catch (err) {
      console.error('downloadFromUrl error', err);
      // fallback: open in new tab
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const handleDownloadDocument = (doc: ClientDocument) => {
    const safeName = (doc.name?.trim() || 'document').replace(/[\\/:*?"<>|]+/g, '-');
    downloadFromUrl(doc.url, safeName);
  };

  const handleDownloadItem = (item: GalleryItem) => {
    const safeTitle = (item.title || 'photo').replace(/[\\/:*?"<>|]+/g, '-').trim() || 'photo';

    // Try to preserve file extension if present
    let ext = '.jpg';
    try {
      const u = new URL(item.url);
      const p = u.pathname;
      const maybe = p.split('.').pop();
      if (maybe && maybe.length <= 5) ext = `.${maybe}`;
    } catch {}

    downloadFromUrl(item.url, safeTitle.endsWith(ext) ? safeTitle : `${safeTitle}${ext}`);
  };

  const handleDownloadAlbum = async () => {
    if (!activeAlbum || galleryItems.length === 0) return;

    // Note: browsers may block many automatic downloads.
    for (const item of galleryItems) {
      handleDownloadItem(item);
      await new Promise((r) => setTimeout(r, 350));
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      // appointments (best-effort, depends on your RLS)
      const apps = await api.getAppointments();
      setAppointments(apps.slice(0, 1));

      // albums for this client
      const clientAlbums = await api.getClientAlbums(user.id);
      setAlbums(clientAlbums);

      // client documents
      const docs = await api.getClientDocuments(user.id);
      setDocuments(docs);
    };

    fetchData().catch((e) => {
      console.error('ClientDashboard fetchData error', e);
      // Keep UI alive even if something fails
      setAlbums([]);
      setGalleryItems([]);
      setDocuments([]);
    });
  }, [user.id]);

  useEffect(() => {
    const fetchPhotos = async () => {
      if (!activeAlbum) {
        setGalleryItems([]);
        return;
      }
      const photos = await api.getGalleryByAlbum(activeAlbum.id);
      setGalleryItems(photos);
    };

    fetchPhotos().catch((e) => {
      console.error('ClientDashboard fetchPhotos error', e);
      setGalleryItems([]);
    });
  }, [activeAlbum]);

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="bg-white border-b border-stone-200 px-8 py-4 flex justify-between items-center sticky top-0 z-30">
        <h1 className="font-serif text-2xl text-stone-900">
          {t('login.brand')}{' '}
          <span className="text-stone-400 font-sans text-xs uppercase tracking-wide ml-2">
            {t('login.clientPortal')}
          </span>
        </h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-stone-600 hidden md:inline">
            {t('client.welcome', { name: user.name })}
          </span>
          <button
            onClick={onLogout}
            className="flex items-center gap-2 text-xs uppercase tracking-wider hover:text-stone-500"
          >
            <LogOut size={16} /> Logout
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-8 grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1 space-y-8">
          <div className="bg-white p-6 shadow-sm border border-stone-100">
            <h3 className="font-serif text-xl mb-4 flex items-center gap-2">
              <CalendarIcon size={20} className="text-stone-400" />
              {t('client.nextSession')}
            </h3>
            {appointments.length > 0 ? (
              <div>
                <div className="text-sm font-bold text-stone-800">{appointments[0].type}</div>
                <div className="text-stone-600 mt-1">
                  {appointments[0].date} {t('client.at')} {appointments[0].time}
                </div>
                <div className="mt-2 text-xs px-2 py-1 bg-green-100 text-green-800 inline-block rounded">
                  {String(appointments[0].status || '').toUpperCase()}
                </div>
              </div>
            ) : (
              <p className="text-stone-500 text-sm">{t('client.noUpcoming')}</p>
            )}
          </div>

          <div className="bg-white p-6 shadow-sm border border-stone-100">
            <h3 className="font-serif text-xl mb-4 flex items-center gap-2">
              <Paperclip size={20} className="text-stone-400" />
              {t('client.myDocuments')}
            </h3>

            {documents.length > 0 ? (
              <ul className="space-y-3">
                {documents.map((doc) => (
                  <li
                    key={doc.id}
                    className="flex items-center justify-between text-sm border-b border-stone-50 pb-2 last:border-0"
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <FileText size={14} className="text-stone-400 flex-shrink-0" />
                      <span className="truncate text-stone-600" title={doc.name}>
                        {doc.name}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDownloadDocument(doc)}
                      className="text-stone-400 hover:text-stone-800"
                      title={t('client.download')}
                      aria-label={t('client.download')}
                    >
                      <Download size={14} />
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-stone-500 text-sm italic">No documents attached.</p>
            )}
          </div>

          <div className="bg-white p-6 shadow-sm border border-stone-100">
            <h3 className="font-serif text-xl mb-4">{t('client.leaveReview')}</h3>
            <textarea
              className="w-full border border-stone-200 p-2 text-sm text-stone-700 h-32 resize-none focus:outline-none focus:border-stone-400"
              placeholder={t('client.reviewPlaceholder')}
              value={review}
              onChange={(e) => setReview(e.target.value)}
            />
            <button className="mt-2 w-full bg-stone-800 text-white py-2 text-xs uppercase tracking-widest hover:bg-stone-700">
              {t('client.submitReview')}
            </button>
          </div>
        </div>

        <div className="lg:col-span-3">
          {activeAlbum ? (
            <div className="fade-enter-active">
              <div className="flex flex-col gap-4 mb-6">
                <button
                  onClick={() => setActiveAlbum(null)}
                  className="text-stone-500 hover:text-stone-800 text-xs uppercase tracking-widest flex items-center gap-2 self-start"
                >
                  <ArrowLeft size={16} /> {t('client.backToCollections')}
                </button>

                <div className="flex justify-between items-end">
                  <h2 className="font-serif text-3xl text-stone-800">{activeAlbum.title}</h2>

                  <button
                    type="button"
                    onClick={handleDownloadAlbum}
                    className="flex items-center gap-2 text-sm text-stone-500 hover:text-stone-900 transition-colors"
                  >
                    <Download size={18} /> {t('client.downloadAlbum')}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {galleryItems.map((item) => (
                  <div key={item.id} className="group relative aspect-[3/4] bg-stone-200 overflow-hidden">
                    <img
                      src={item.url}
                      alt={item.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-stone-900/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => handleDownloadItem(item)}
                        className="bg-white text-stone-900 px-6 py-2 text-xs uppercase tracking-widest hover:bg-stone-100 shadow-lg"
                      >
                        {t('client.download')}
                      </button>
                    </div>
                  </div>
                ))}

                {galleryItems.length === 0 && (
                  <div className="col-span-full py-12 text-center text-stone-400 text-sm">
                    {t('client.noPhotosYet')}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="fade-enter-active">
              <h2 className="font-serif text-3xl text-stone-800 mb-6">{t('client.yourCollections')}</h2>

              {albums.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {albums.map((album) => (
                    <div
                      key={album.id}
                      onClick={() => setActiveAlbum(album)}
                      className="group bg-white border border-stone-100 shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden"
                    >
                      <div className="aspect-[3/2] bg-stone-200 relative overflow-hidden">
                        {album.coverUrl ? (
                          <img
                            src={album.coverUrl}
                            alt={album.title}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-stone-400">
                            <Image size={32} />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-stone-900/0 group-hover:bg-stone-900/10 transition-colors" />
                      </div>
                      <div className="p-6">
                        <h3 className="font-serif text-xl text-stone-800 mb-1">{album.title}</h3>
                        <p className="text-xs text-stone-500 uppercase tracking-widest">
                          {t('client.created')} {album.createdAt}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white border-dashed border-2 border-stone-200 rounded p-12 text-center">
                  <Folder size={42} className="mx-auto text-stone-300 mb-4" />
                  <div className="text-stone-500">{t('client.noCollectionsYet')}</div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
