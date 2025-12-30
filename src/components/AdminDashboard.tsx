import React, { useEffect, useMemo, useState } from 'react';
import { User, Appointment, GalleryItem, Album, ClientDocument } from '../types';
import { api } from '../services/api';
import {
  Calendar as CalendarIcon,
  Users,
  Image,
  LogOut,
  CheckCircle,
  Clock,
  Edit2,
  Plus,
  Trash2,
  X,
  Save,
  FolderPlus,
  ArrowLeft,
  Upload,
  Folder,
  UserCheck,
  Archive,
  RefreshCcw,
  FileText,
  Smartphone,
  Hash,
  Paperclip,
  Eye,
  Download,
  Shield
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { AdminAppointmentsCalendar } from './AdminAppointmentsCalendar';

interface AdminDashboardProps {
  onLogout: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout }) => {
  const { t } = useTranslation();

  const [view, setView] = useState<'overview' | 'calendar' | 'clients' | 'gallery' | 'staff'>('overview');

  // Data State
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [clients, setClients] = useState<User[]>([]);
  const [staff, setStaff] = useState<User[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);

  // Client View State
  const [clientFilter, setClientFilter] = useState<'active' | 'archived'>('active');
  const [selectedClient, setSelectedClient] = useState<User | null>(null);

  // Client Edit State
  const [isEditingClientDetails, setIsEditingClientDetails] = useState(false);
  const [editClientFormData, setEditClientFormData] = useState<Partial<User>>({});

  // Gallery Navigation State
  const [activeAlbum, setActiveAlbum] = useState<Album | null>(null);

  // UI State for Editing/Adding
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [isAddingClient, setIsAddingClient] = useState(false);
  const [isAddingAlbum, setIsAddingAlbum] = useState(false);

  // ✅ Staff Management UI state
  const [isAddingStaff, setIsAddingStaff] = useState(false);
  const [newStaffData, setNewStaffData] = useState({
    firstName: '',
    familyName: '',
    email: '',
    password: '',
    phone: ''
  });

  // Form States
  const [newClientData, setNewClientData] = useState({ name: '', email: '', phone: '', loginCode: '' });
  const [newAlbumData, setNewAlbumData] = useState({ title: '', clientId: '' });
  const [newGalleryData, setNewGalleryData] = useState({ url: '', title: '' });
  const [uploading, setUploading] = useState(false);

  const convertFileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });

  const refreshData = async () => {
    // Appointments
    try {
      const apps = await api.getAppointments();
      setAppointments(apps);
    } catch (error) {
      console.error('Error loading appointments:', error);
      setAppointments([]);
    }

    // Clients (and keep selectedClient modal in sync)
    try {
      const users = await api.getClients();
      setClients(users);

      if (selectedClient) {
        const updatedClient = users.find(u => u.id === selectedClient.id);
        if (updatedClient) {
          try {
            const docs = await api.getClientDocuments(updatedClient.id);
            setSelectedClient({ ...updatedClient, documents: docs });
          } catch (e) {
            console.warn('Failed to load client documents', e);
            setSelectedClient({ ...updatedClient, documents: [] });
          }
        }
      }
    } catch (error) {
      console.error('Error loading clients:', error);
      setClients([]);
    }

    // Staff list
    try {
      const staffUsers = await api.getStaff();
      setStaff(staffUsers);
    } catch (error) {
      console.warn('Error loading staff:', error);
      setStaff([]);
    }

    // Albums + Gallery
    try {
      const alb = await api.getAlbums();
      setAlbums(alb);

      if (activeAlbum) {
        const albumExists = alb.find(a => a.id === activeAlbum.id);
        if (albumExists) {
          const photos = await api.getGalleryByAlbum(activeAlbum.id);
          setGalleryItems(photos);
        } else {
          setActiveAlbum(null);
          const allPhotos = await api.getAllPhotos();
          setGalleryItems(allPhotos);
        }
      } else {
        const allPhotos = await api.getAllPhotos();
        setGalleryItems(allPhotos);
      }
    } catch (error) {
      console.error('Error loading gallery/albums:', error);
      setGalleryItems([]);
    }
  };

  useEffect(() => {
    refreshData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeAlbum?.id, clientFilter, view]);

  // Sync edit form data when client is selected
  useEffect(() => {
    if (selectedClient) {
      setEditClientFormData({
        name: selectedClient.name,
        email: selectedClient.email,
        phone: selectedClient.phone,
        loginCode: selectedClient.loginCode
      });
      setIsEditingClientDetails(false);
    }
  }, [selectedClient]);

  // --- Handlers ---

  const handleUpdateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAppointment) return;

    await api.updateAppointment(editingAppointment.id, editingAppointment);

    setEditingAppointment(null);
    await refreshData();
  };

  const generateRandomCode = () => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setNewClientData({ ...newClientData, loginCode: code });
  };

  const handleAddClient = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (newClientData.name && newClientData.loginCode) {
        await api.createClient(newClientData.name, newClientData.email, newClientData.phone, newClientData.loginCode);
        setNewClientData({ name: '', email: '', phone: '', loginCode: '' });
        setIsAddingClient(false);
        await refreshData();
      }
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : String(err));
    }
  };

  // ✅ Staff creation
  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createStaff(
        newStaffData.firstName,
        newStaffData.familyName,
        newStaffData.email,
        newStaffData.password,
        newStaffData.phone
      );

      setNewStaffData({ firstName: '', familyName: '', email: '', password: '', phone: '' });
      setIsAddingStaff(false);
      await refreshData();
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : String(err));
    }
  };

  const handleSaveClientDetails = async () => {
    if (selectedClient && editClientFormData) {
      await api.updateClient(selectedClient.id, editClientFormData);
      setIsEditingClientDetails(false);
      await refreshData();
    }
  };

  const handleArchiveClient = async (id: string) => {
    if (window.confirm(t('admin.clients.confirmArchive'))) {
      await api.archiveClient(id);
      await refreshData();
    }
  };

  const handleUnarchiveClient = async (id: string) => {
    if (window.confirm(t('admin.clients.confirmRestore'))) {
      await api.unarchiveClient(id);
      await refreshData();
    }
  };

  const openClientFile = async (client: User) => {
    try {
      const docs = await api.getClientDocuments(client.id);
      setSelectedClient({ ...client, documents: docs });
    } catch (e) {
      console.warn('Failed to load client documents', e);
      setSelectedClient({ ...client, documents: [] });
    }
  };

  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !selectedClient) return;
    const file = e.target.files[0];
    if (!file) return;

    try {
      const base64 = await convertFileToBase64(file);

      let type: ClientDocument['type'] = 'other';
      if (file.type.includes('image')) type = 'image';
      if (file.type.includes('pdf')) type = 'pdf';
      if (file.type.includes('word') || file.type.includes('document')) type = 'doc';

      await api.uploadDocument(selectedClient.id, file.name, base64, type);

      e.target.value = '';
      await refreshData();
    } catch (error) {
      console.error('Upload failed', error);
    }
  };

  const handleDeleteDocument = async (docId: string) => {
    if (selectedClient && window.confirm(t('admin.clients.confirmDeleteDocument'))) {
      await api.deleteDocument(selectedClient.id, docId);
      await refreshData();
    }
  };

  const handleCreateAlbum = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newAlbumData.title) {
      await api.createAlbum(newAlbumData.title, newAlbumData.clientId || undefined);
      setNewAlbumData({ title: '', clientId: '' });
      setIsAddingAlbum(false);
      await refreshData();
    }
  };

  const handleDeleteAlbum = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm(t('admin.gallery.confirmDeleteAlbum'))) {
      await api.deleteAlbum(id);
      if (activeAlbum?.id === id) setActiveAlbum(null);
      await refreshData();
    }
  };

  const handleAddPhotoUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newGalleryData.url && activeAlbum) {
      await api.addGalleryItem(activeAlbum.id, newGalleryData.url, newGalleryData.title || t('admin.gallery.untitled'));
      setNewGalleryData({ url: '', title: '' });
      await refreshData();
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !activeAlbum) return;

    setUploading(true);
    const files: File[] = Array.from(e.target.files);

    for (const file of files) {
      try {
        const base64 = await convertFileToBase64(file);
        await api.addGalleryItem(activeAlbum.id, base64, file.name.split('.')[0]);
      } catch (err) {
        console.error('Failed to upload file', file.name, err);
      }
    }

    setUploading(false);
    await refreshData();
    e.target.value = '';
  };

  const handleDeletePhoto = async (id: string) => {
    if (window.confirm(t('admin.gallery.confirmDeletePhoto'))) {
      await api.deleteGalleryItem(id);
      await refreshData();
    }
  };

  const safeShowPicker = (e: React.MouseEvent<HTMLInputElement>) => {
    try {
      if ('showPicker' in e.currentTarget && typeof (e.currentTarget as any).showPicker === 'function') {
        (e.currentTarget as any).showPicker();
      }
    } catch {
      // ignore
    }
  };

  const getClientName = (clientId?: string) => {
    if (!clientId) return null;
    return clients.find(c => c.id === clientId)?.name || t('admin.common.unknownClient');
  };

  const getStaffName = (staffUserId?: string) => {
    if (!staffUserId) return t('admin.overview.unassigned') || 'Unassigned';
    return staff.find(s => s.id === staffUserId)?.name || t('admin.common.unknownClient');
  };

  const displayedClients = useMemo(
    () => clients.filter(c => (clientFilter === 'active' ? c.status !== 'archived' : c.status === 'archived')),
    [clients, clientFilter]
  );

  return (
    <div className="min-h-screen bg-stone-100 flex relative">
      {/* Sidebar */}
      <aside className="w-64 bg-stone-900 text-stone-400 flex flex-col fixed h-full z-10 overflow-y-auto">
        <div className="p-6">
          <h1 className="font-serif text-2xl text-white">{t('admin.sidebar.title')}</h1>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          <button
            onClick={() => {
              setView('overview');
              setActiveAlbum(null);
            }}
            className={`w-full text-left px-4 py-3 rounded flex items-center gap-3 transition-colors ${
              view === 'overview' ? 'bg-stone-800 text-white' : 'hover:bg-stone-800'
            }`}
          >
            <CalendarIcon size={18} /> {t('admin.sidebar.overview')}
          </button>

          {/* Calendar view for confirmed appointments */}
          <button
            onClick={() => {
              setView('calendar');
              setActiveAlbum(null);
            }}
            className={`w-full text-left px-4 py-3 rounded flex items-center gap-3 transition-colors ${
              view === 'calendar' ? 'bg-stone-800 text-white' : 'hover:bg-stone-800'
            }`}
          >
            <CalendarIcon size={18} /> Calendrier
          </button>

          <button
            onClick={() => {
              setView('clients');
              setActiveAlbum(null);
            }}
            className={`w-full text-left px-4 py-3 rounded flex items-center gap-3 transition-colors ${
              view === 'clients' ? 'bg-stone-800 text-white' : 'hover:bg-stone-800'
            }`}
          >
            <Users size={18} /> {t('admin.sidebar.clients')}
          </button>

          <button
            onClick={() => {
              setView('gallery');
              setActiveAlbum(null);
            }}
            className={`w-full text-left px-4 py-3 rounded flex items-center gap-3 transition-colors ${
              view === 'gallery' ? 'bg-stone-800 text-white' : 'hover:bg-stone-800'
            }`}
          >
            <Image size={18} /> {t('admin.sidebar.gallery')}
          </button>

          {/* ✅ Staff Management */}
          <button
            onClick={() => {
              setView('staff');
              setActiveAlbum(null);
            }}
            className={`w-full text-left px-4 py-3 rounded flex items-center gap-3 transition-colors ${
              view === 'staff' ? 'bg-stone-800 text-white' : 'hover:bg-stone-800'
            }`}
          >
            <Shield size={18} /> Staff Management
          </button>
        </nav>

        <div className="p-4 border-t border-stone-800">
          <button onClick={onLogout} className="flex items-center gap-2 text-sm hover:text-white transition-colors">
            <LogOut size={16} /> {t('common.logout')}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto ml-64">
        {/* VIEW: CALENDAR */}
        {view === 'calendar' && (
          <div className="space-y-6 fade-enter-active">
            <header className="flex justify-between items-center mb-2">
              <h2 className="font-serif text-3xl text-stone-800">Calendrier</h2>
              <button
                onClick={refreshData}
                className="text-xs uppercase tracking-widest px-4 py-2 border border-stone-300 hover:border-stone-800 hover:text-stone-900 transition-colors flex items-center gap-2"
              >
                <RefreshCcw size={14} /> Actualiser
              </button>
            </header>

            <AdminAppointmentsCalendar appointments={appointments.filter(a => a.status === 'confirmed')} />
          </div>
        )}

        {/* VIEW: OVERVIEW */}
        {view === 'overview' && (
          <div className="space-y-8 fade-enter-active">
            <header className="flex justify-between items-center mb-8">
              <h2 className="font-serif text-3xl text-stone-800">{t('admin.overview.title')}</h2>
            </header>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white p-6 shadow-sm border border-stone-200">
                <div className="text-stone-500 text-xs uppercase tracking-wide mb-2">{t('admin.overview.pendingRequests')}</div>
                <div className="text-3xl font-serif text-stone-800">{appointments.filter(a => a.status === 'pending').length}</div>
              </div>

              <div className="bg-white p-6 shadow-sm border border-stone-200">
                <div className="text-stone-500 text-xs uppercase tracking-wide mb-2">{t('admin.overview.totalAlbums')}</div>
                <div className="text-3xl font-serif text-stone-800">{albums.length}</div>
              </div>

              <div className="bg-white p-6 shadow-sm border border-stone-200">
                <div className="text-stone-500 text-xs uppercase tracking-wide mb-2">{t('admin.overview.activeClients')}</div>
                <div className="text-3xl font-serif text-stone-800">{clients.filter(c => c.status !== 'archived').length}</div>
              </div>

              <div className="bg-white p-6 shadow-sm border border-stone-200">
                <div className="text-stone-500 text-xs uppercase tracking-wide mb-2">{t('admin.overview.staffMembers') || 'Staff Members'}</div>
                <div className="text-3xl font-serif text-stone-800">{staff.length}</div>
              </div>
            </div>

            {/* Appointment List */}
            <div className="bg-white shadow-sm border border-stone-200">
              <div className="px-6 py-4 border-b border-stone-200 flex justify-between items-center">
                <h3 className="font-serif text-xl text-stone-800">{t('admin.overview.allAppointments')}</h3>
              </div>

              <table className="w-full text-left">
                <thead className="bg-stone-50 text-stone-500 text-xs uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-3 font-medium">{t('admin.overview.table.client')}</th>
                    <th className="px-6 py-3 font-medium">{t('admin.overview.table.dateTime')}</th>
                    <th className="px-6 py-3 font-medium">{t('admin.overview.table.type')}</th>
                    <th className="px-6 py-3 font-medium">{t('admin.overview.table.assignedStaff') || 'Assigned Staff'}</th>
                    <th className="px-6 py-3 font-medium">{t('admin.overview.table.status')}</th>
                    <th className="px-6 py-3 font-medium">{t('admin.overview.table.actions')}</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-stone-100">
                  {appointments.map(app => (
                    <tr key={app.id} className="hover:bg-stone-50 transition-colors">
                      <td className="px-6 py-4 text-stone-800 font-medium">{app.clientName}</td>

                      <td className="px-6 py-4 text-stone-600">
                        {app.date} <span className="text-stone-400 text-xs ml-1">{app.time}</span>
                      </td>

                      <td className="px-6 py-4 text-stone-600">{app.type}</td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-stone-600">
                          <Shield size={14} className={app.staffId ? 'text-green-600' : 'text-stone-300'} />
                          {getStaffName(app.staffId)}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                            app.status === 'confirmed'
                              ? 'bg-green-100 text-green-800'
                              : app.status === 'completed'
                              ? 'bg-stone-200 text-stone-600'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {app.status === 'confirmed' ? <CheckCircle size={12} /> : <Clock size={12} />}
                          {t(`admin.overview.status.${app.status}`)}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <button
                          onClick={() => setEditingAppointment(app)}
                          className="text-stone-500 hover:text-stone-900 text-sm flex items-center gap-2 px-3 py-1 border border-stone-200 rounded hover:bg-white transition-all"
                        >
                          <Edit2 size={14} /> {t('common.edit')}
                        </button>
                      </td>
                    </tr>
                  ))}

                  {appointments.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-stone-400 text-sm italic">
                        {t('admin.overview.noAppointments')}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ✅ VIEW: STAFF MANAGEMENT */}
        {view === 'staff' && (
          <div className="space-y-8 fade-enter-active">
            <header className="flex justify-between items-center mb-6">
              <h2 className="font-serif text-3xl text-stone-800">Staff Management</h2>
              <button
                onClick={() => setIsAddingStaff(!isAddingStaff)}
                className="bg-stone-900 text-white px-6 py-2 text-xs uppercase tracking-widest hover:bg-stone-700 flex items-center gap-2"
              >
                {isAddingStaff ? <X size={16} /> : <Plus size={16} />}
                {isAddingStaff ? 'Cancel' : 'New Staff'}
              </button>
            </header>

            {isAddingStaff && (
              <div className="bg-stone-50 border border-stone-200 p-6 rounded-lg animate-fade-in">
                <h3 className="font-serif text-xl mb-4 text-stone-800">Create Staff Member</h3>
                <form onSubmit={handleAddStaff} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs uppercase tracking-wide text-stone-500">First Name</label>
                      <input
                        type="text"
                        required
                        value={newStaffData.firstName}
                        onChange={e => setNewStaffData({ ...newStaffData, firstName: e.target.value })}
                        className="w-full border border-stone-300 p-2 text-sm rounded bg-white"
                        placeholder="Hamza"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs uppercase tracking-wide text-stone-500">Family Name</label>
                      <input
                        type="text"
                        required
                        value={newStaffData.familyName}
                        onChange={e => setNewStaffData({ ...newStaffData, familyName: e.target.value })}
                        className="w-full border border-stone-300 p-2 text-sm rounded bg-white"
                        placeholder="Souli"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs uppercase tracking-wide text-stone-500">Email (Login)</label>
                      <input
                        type="email"
                        required
                        value={newStaffData.email}
                        onChange={e => setNewStaffData({ ...newStaffData, email: e.target.value })}
                        className="w-full border border-stone-300 p-2 text-sm rounded bg-white"
                        placeholder="staff@email.com"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs uppercase tracking-wide text-stone-500">Phone</label>
                      <input
                        type="text"
                        value={newStaffData.phone}
                        onChange={e => setNewStaffData({ ...newStaffData, phone: e.target.value })}
                        className="w-full border border-stone-300 p-2 text-sm rounded bg-white"
                        placeholder="+216 ..."
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs uppercase tracking-wide text-stone-500">Temporary Password</label>
                    <input
                      type="password"
                      required
                      value={newStaffData.password}
                      onChange={e => setNewStaffData({ ...newStaffData, password: e.target.value })}
                      className="w-full border border-stone-300 p-2 text-sm rounded bg-white"
                      placeholder="Set an initial password"
                    />
                    <p className="text-xs text-stone-400 mt-1">
                      Staff will be able to change this later from their dashboard (next step).
                    </p>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      className="bg-stone-800 text-white px-8 py-2 rounded text-sm uppercase tracking-wide hover:bg-stone-700"
                    >
                      Create Staff
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="bg-white shadow-sm border border-stone-200 rounded-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-stone-200 flex justify-between items-center">
                <h3 className="font-serif text-xl text-stone-800">All Staff</h3>
              </div>

              <table className="w-full text-left">
                <thead className="bg-stone-50 text-stone-500 text-xs uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-3 font-medium">Name</th>
                    <th className="px-6 py-3 font-medium">Email</th>
                    <th className="px-6 py-3 font-medium">Phone</th>
                    <th className="px-6 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {staff.map(s => (
                    <tr key={s.id} className="hover:bg-stone-50 transition-colors">
                      <td className="px-6 py-4 text-stone-800 font-medium">{s.name}</td>
                      <td className="px-6 py-4 text-stone-600 font-mono text-sm">{s.email || '-'}</td>
                      <td className="px-6 py-4 text-stone-600">{s.phone || '-'}</td>
                      <td className="px-6 py-4">
                        <span className="inline-block px-2 py-1 text-xs rounded-full uppercase tracking-wider bg-green-50 text-green-700">
                          {s.status || 'active'}
                        </span>
                      </td>
                    </tr>
                  ))}

                  {staff.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-stone-400 text-sm italic">
                        No staff members yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* VIEW: CLIENTS */}
        {view === 'clients' && (
          <div className="space-y-8 fade-enter-active">
            <header className="flex justify-between items-end mb-8">
              <div>
                <h2 className="font-serif text-3xl text-stone-800 mb-2">{t('admin.clients.title')}</h2>
                <div className="flex gap-4 border-b border-stone-200">
                  <button
                    onClick={() => setClientFilter('active')}
                    className={`pb-2 text-sm uppercase tracking-wider ${
                      clientFilter === 'active' ? 'border-b-2 border-stone-800 text-stone-900' : 'text-stone-400'
                    }`}
                  >
                    {t('admin.clients.filters.active')}
                  </button>
                  <button
                    onClick={() => setClientFilter('archived')}
                    className={`pb-2 text-sm uppercase tracking-wider ${
                      clientFilter === 'archived' ? 'border-b-2 border-stone-800 text-stone-900' : 'text-stone-400'
                    }`}
                  >
                    {t('admin.clients.filters.archived')}
                  </button>
                </div>
              </div>

              <button
                onClick={() => setIsAddingClient(!isAddingClient)}
                className="bg-stone-900 text-white px-6 py-2 text-xs uppercase tracking-widest hover:bg-stone-700 flex items-center gap-2"
              >
                {isAddingClient ? <X size={16} /> : <Plus size={16} />}
                {isAddingClient ? t('common.cancel') : t('admin.clients.newClient')}
              </button>
            </header>

            {isAddingClient && (
              <div className="bg-stone-50 border border-stone-200 p-6 rounded-lg mb-8 animate-fade-in">
                <h3 className="font-serif text-xl mb-4 text-stone-800">{t('admin.clients.registerTitle')}</h3>

                <form onSubmit={handleAddClient} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs uppercase tracking-wide text-stone-500">{t('admin.clients.form.fullName')}</label>
                      <input
                        type="text"
                        required
                        value={newClientData.name}
                        onChange={e => setNewClientData({ ...newClientData, name: e.target.value })}
                        className="w-full border border-stone-300 p-2 text-sm rounded bg-white"
                        placeholder={t('admin.clients.form.fullNamePlaceholder')}
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs uppercase tracking-wide text-stone-500">{t('admin.clients.form.email')}</label>
                      <input
                        type="email"
                        value={newClientData.email}
                        onChange={e => setNewClientData({ ...newClientData, email: e.target.value })}
                        className="w-full border border-stone-300 p-2 text-sm rounded bg-white"
                        placeholder={t('admin.clients.form.emailPlaceholder')}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                    <div className="space-y-1">
                      <label className="text-xs uppercase tracking-wide text-stone-500">{t('admin.clients.form.phone')}</label>
                      <input
                        type="text"
                        value={newClientData.phone}
                        onChange={e => setNewClientData({ ...newClientData, phone: e.target.value })}
                        className="w-full border border-stone-300 p-2 text-sm rounded bg-white"
                        placeholder={t('admin.clients.form.phonePlaceholder')}
                      />
                    </div>

                    <div className="flex gap-2">
                      <div className="flex-grow space-y-1">
                        <label className="text-xs uppercase tracking-wide text-stone-500">{t('admin.clients.form.loginCode')}</label>
                        <input
                          type="text"
                          required
                          readOnly
                          value={newClientData.loginCode}
                          className="w-full border border-stone-300 p-2 text-sm rounded bg-stone-100 font-mono tracking-widest text-center"
                          placeholder="------"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={generateRandomCode}
                        className="bg-stone-200 text-stone-800 px-3 py-2 rounded text-xs uppercase tracking-wide hover:bg-stone-300 h-[38px] mt-auto"
                      >
                        {t('admin.clients.form.generateCode')}
                      </button>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      className="bg-stone-800 text-white px-8 py-2 rounded text-sm uppercase tracking-wide hover:bg-stone-700"
                    >
                      {t('admin.clients.form.create')}
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="bg-white shadow-sm border border-stone-200">
              <table className="w-full text-left">
                <thead className="bg-stone-50 text-stone-500 text-xs uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-3 font-medium">{t('admin.clients.table.clientInfo')}</th>
                    <th className="px-6 py-3 font-medium">{t('admin.clients.table.loginCode')}</th>
                    <th className="px-6 py-3 font-medium">{t('admin.clients.table.status')}</th>
                    <th className="px-6 py-3 font-medium text-right">{t('admin.clients.table.actions')}</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-stone-100">
                  {displayedClients.map(client => (
                    <tr key={client.id} className="hover:bg-stone-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-bold ${
                              client.status === 'archived' ? 'bg-stone-100 text-stone-400' : 'bg-stone-200 text-stone-600'
                            }`}
                          >
                            {client.name.charAt(0)}
                          </div>
                          <div>
                            <div className={`font-medium ${client.status === 'archived' ? 'text-stone-400' : 'text-stone-800'}`}>
                              {client.name}
                            </div>
                            <div className="text-xs text-stone-500 font-mono">{client.email}</div>
                            {client.phone && <div className="text-xs text-stone-400">{client.phone}</div>}
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <span className="font-mono bg-stone-100 px-2 py-1 rounded text-stone-800 tracking-widest text-sm">
                          {client.loginCode || t('common.na')}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`inline-block px-2 py-1 text-xs rounded-full uppercase tracking-wider ${
                            client.status === 'archived' ? 'bg-stone-100 text-stone-400' : 'bg-green-50 text-green-700'
                          }`}
                        >
                          {t(`admin.clients.status.${client.status || 'active'}`)}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => openClientFile(client)}
                            className="flex items-center gap-1 text-stone-800 hover:text-stone-600 border border-stone-300 px-3 py-1 rounded text-xs uppercase hover:bg-stone-50"
                          >
                            <Folder size={14} /> {t('admin.clients.manageFile')}
                          </button>

                          {clientFilter === 'active' ? (
                            <button
                              onClick={() => handleArchiveClient(client.id)}
                              className="text-stone-400 hover:text-stone-800 p-1 rounded hover:bg-stone-100"
                              title={t('admin.clients.archive')}
                            >
                              <Archive size={16} />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleUnarchiveClient(client.id)}
                              className="text-stone-400 hover:text-stone-800 p-1 rounded hover:bg-stone-100"
                              title={t('admin.clients.restore')}
                            >
                              <RefreshCcw size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}

                  {displayedClients.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-stone-400 text-sm italic">
                        {t('admin.clients.none', { filter: clientFilter })}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* VIEW: GALLERY MANAGER */}
        {view === 'gallery' && !activeAlbum && (
          <div className="space-y-8 fade-enter-active">
            <header className="flex justify-between items-center mb-8">
              <h2 className="font-serif text-3xl text-stone-800">{t('admin.gallery.title')}</h2>
              <button
                onClick={() => setIsAddingAlbum(!isAddingAlbum)}
                className="bg-stone-900 text-white px-6 py-2 text-xs uppercase tracking-widest hover:bg-stone-700 flex items-center gap-2"
              >
                {isAddingAlbum ? <X size={16} /> : <FolderPlus size={16} />}
                {isAddingAlbum ? t('common.cancel') : t('admin.gallery.newAlbum')}
              </button>
            </header>

            {isAddingAlbum && (
              <div className="bg-stone-50 border border-stone-200 p-6 rounded-lg mb-8 animate-fade-in">
                <form onSubmit={handleCreateAlbum} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                  <div className="space-y-1">
                    <label className="text-xs uppercase tracking-wide text-stone-500">{t('admin.gallery.form.albumTitle')}</label>
                    <input
                      type="text"
                      required
                      value={newAlbumData.title}
                      onChange={e => setNewAlbumData({ ...newAlbumData, title: e.target.value })}
                      className="w-full border border-stone-300 p-2 text-sm rounded bg-white"
                      placeholder={t('admin.gallery.form.albumTitlePlaceholder')}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs uppercase tracking-wide text-stone-500">{t('admin.gallery.form.assignClient')}</label>
                    <select
                      value={newAlbumData.clientId}
                      onChange={e => setNewAlbumData({ ...newAlbumData, clientId: e.target.value })}
                      className="w-full border border-stone-300 p-2 text-sm rounded bg-white"
                    >
                      <option value="">{t('admin.gallery.form.publicPortfolio')}</option>
                      {clients
                        .filter(c => c.status !== 'archived')
                        .map(c => (
                          <option key={c.id} value={c.id}>
                            {c.name} ({c.email})
                          </option>
                        ))}
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="bg-stone-800 text-white px-6 py-2 rounded text-sm uppercase tracking-wide hover:bg-stone-700 h-10"
                  >
                    {t('admin.gallery.form.createAlbum')}
                  </button>
                </form>
              </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {albums.map(album => (
                <div
                  key={album.id}
                  onClick={() => setActiveAlbum(album)}
                  className="group relative bg-white shadow-sm border border-stone-100 rounded overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                >
                  <div className="aspect-square bg-stone-200 relative">
                    {album.coverUrl ? (
                      <img src={album.coverUrl} alt={album.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex items-center justify-center h-full text-stone-400">
                        <Image size={32} />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />

                    {album.clientId && (
                      <div className="absolute top-2 right-2 bg-stone-900/80 text-white text-[10px] px-2 py-1 rounded-full uppercase tracking-wider flex items-center gap-1 shadow-sm">
                        <UserCheck size={10} /> {t('admin.gallery.badgeClient')}
                      </div>
                    )}
                  </div>

                  <div className="p-3 flex justify-between items-start">
                    <div className="overflow-hidden">
                      <p className="text-sm font-medium text-stone-800 truncate">{album.title}</p>
                      <p className="text-xs text-stone-500 flex items-center gap-1 truncate">
                        {album.clientId ? getClientName(album.clientId) : t('admin.gallery.publicPortfolioLabel')}
                      </p>
                    </div>

                    {album.id !== 'default' && (
                      <button
                        onClick={e => handleDeleteAlbum(e, album.id)}
                        className="text-stone-300 hover:text-red-500 transition-colors flex-shrink-0"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VIEW: ALBUM DETAIL */}
        {view === 'gallery' && activeAlbum && (
          <div className="space-y-8 fade-enter-active">
            <header className="flex flex-col gap-4 mb-8">
              <button
                onClick={() => setActiveAlbum(null)}
                className="flex items-center gap-2 text-xs uppercase tracking-wider text-stone-500 hover:text-stone-800 self-start"
              >
                <ArrowLeft size={16} /> {t('admin.gallery.backToAlbums')}
              </button>

              <div className="flex justify-between items-center">
                <div>
                  <h2 className="font-serif text-3xl text-stone-800 flex items-center gap-3">
                    <Folder size={28} className="text-stone-400" />
                    {activeAlbum.title}
                  </h2>
                  <div className="flex items-center gap-4 mt-2">
                    <p className="text-stone-500 text-sm">{t('admin.gallery.photoCount', { count: galleryItems.length })}</p>
                    {activeAlbum.clientId && (
                      <span className="text-xs bg-stone-100 text-stone-600 px-2 py-1 rounded border border-stone-200">
                        {t('admin.gallery.assignedTo', { name: getClientName(activeAlbum.clientId) })}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </header>

            <div className="bg-stone-50 p-6 rounded-lg border border-stone-200">
              <div className="flex flex-col gap-6">
                <div className="border-2 border-dashed border-stone-300 rounded-lg p-8 text-center hover:bg-stone-100 transition-colors relative">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    disabled={uploading}
                  />
                  <div className="flex flex-col items-center gap-2 text-stone-500">
                    {uploading ? (
                      <div className="animate-pulse">{t('admin.gallery.processing')}</div>
                    ) : (
                      <>
                        <Upload size={32} />
                        <span className="text-sm font-medium">{t('admin.gallery.uploadClick')}</span>
                        <span className="text-xs text-stone-400">{t('admin.gallery.uploadHint')}</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="relative flex items-center py-2">
                  <div className="flex-grow border-t border-stone-200"></div>
                  <span className="flex-shrink-0 mx-4 text-stone-400 text-xs uppercase">{t('admin.gallery.orAddViaUrl')}</span>
                  <div className="flex-grow border-t border-stone-200"></div>
                </div>

                <form onSubmit={handleAddPhotoUrl} className="flex gap-4 items-end">
                  <div className="flex-1 space-y-1">
                    <label className="text-xs uppercase tracking-wide text-stone-500">{t('admin.gallery.form.imageUrl')}</label>
                    <input
                      type="url"
                      required
                      value={newGalleryData.url}
                      onChange={e => setNewGalleryData({ ...newGalleryData, url: e.target.value })}
                      className="w-full border border-stone-300 p-2 text-sm rounded bg-white outline-none focus:border-stone-800"
                      placeholder="https://..."
                    />
                  </div>

                  <div className="w-1/3 space-y-1">
                    <label className="text-xs uppercase tracking-wide text-stone-500">{t('admin.gallery.form.titleOptional')}</label>
                    <input
                      type="text"
                      value={newGalleryData.title}
                      onChange={e => setNewGalleryData({ ...newGalleryData, title: e.target.value })}
                      className="w-full border border-stone-300 p-2 text-sm rounded bg-white outline-none focus:border-stone-800"
                      placeholder={t('admin.gallery.form.titlePlaceholder')}
                    />
                  </div>

                  <button type="submit" className="bg-stone-800 text-white px-6 py-2 rounded text-sm uppercase tracking-wide hover:bg-stone-700 h-10">
                    {t('common.add')}
                  </button>
                </form>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {galleryItems.map(item => (
                <div key={item.id} className="group relative bg-white shadow-sm border border-stone-100 rounded overflow-hidden">
                  <div className="aspect-square bg-stone-200">
                    <img src={item.url} alt={item.title} className="w-full h-full object-cover" />
                  </div>
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <button onClick={() => handleDeletePhoto(item.id)} className="text-white hover:text-red-300 transition-colors">
                      <Trash2 size={24} />
                    </button>
                  </div>
                  <div className="p-2 text-xs truncate text-stone-600 bg-white border-t border-stone-100">
                    {item.title || t('admin.gallery.untitled')}
                  </div>
                </div>
              ))}

              {galleryItems.length === 0 && (
                <div className="col-span-full py-12 text-center text-stone-400 italic text-sm">{t('admin.gallery.emptyAlbum')}</div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* EDIT APPOINTMENT MODAL */}
      {editingAppointment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm" onClick={() => setEditingAppointment(null)}>
          <div className="bg-white p-8 rounded-lg shadow-2xl max-w-md w-full animate-fade-in" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-serif text-2xl text-stone-900">{t('admin.overview.editAppointment')}</h3>
              <button onClick={() => setEditingAppointment(null)} className="text-stone-400 hover:text-stone-800">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleUpdateAppointment} className="space-y-6">
              {/* Assigned Staff (maps to appointments.user_id) */}
              <div className="space-y-1">
                <label className="text-xs uppercase tracking-wide text-stone-500">{t('admin.overview.form.assignedStaff') || 'Assigned Staff'}</label>
                <select
                  value={editingAppointment.staffId || ''}
                  onChange={e => setEditingAppointment({ ...editingAppointment, staffId: e.target.value || undefined })}
                  className="w-full border-b border-stone-300 py-2 focus:outline-none focus:border-stone-800 bg-transparent text-stone-800"
                >
                  <option value="">{t('admin.overview.unassigned') || 'Unassigned'}</option>
                  {staff.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} {s.email ? `(${s.email})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs uppercase tracking-wide text-stone-500">{t('admin.overview.form.status')}</label>
                <select
                  value={editingAppointment.status}
                  onChange={e => setEditingAppointment({ ...editingAppointment, status: e.target.value as any })}
                  className="w-full border-b border-stone-300 py-2 focus:outline-none focus:border-stone-800 bg-transparent text-stone-800"
                >
                  <option value="pending">{t('admin.overview.status.pending')}</option>
                  <option value="confirmed">{t('admin.overview.status.confirmed')}</option>
                  <option value="completed">{t('admin.overview.status.completed')}</option>
                  <option value="cancelled">{t('admin.overview.status.cancelled') || 'Cancelled'}</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs uppercase tracking-wide text-stone-500">{t('admin.overview.form.date')}</label>
                  <input
                    type="date"
                    value={editingAppointment.date || ''}
                    onClick={safeShowPicker}
                    onChange={e => setEditingAppointment({ ...editingAppointment, date: e.target.value })}
                    className="w-full border-b border-stone-300 py-2 focus:outline-none focus:border-stone-800 bg-transparent text-stone-800 cursor-pointer"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs uppercase tracking-wide text-stone-500">{t('admin.overview.form.time')}</label>
                  <input
                    type="time"
                    value={editingAppointment.time || ''}
                    onClick={safeShowPicker}
                    onChange={e => setEditingAppointment({ ...editingAppointment, time: e.target.value })}
                    className="w-full border-b border-stone-300 py-2 focus:outline-none focus:border-stone-800 bg-transparent text-stone-800 cursor-pointer"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs uppercase tracking-wide text-stone-500">{t('admin.overview.form.type')}</label>
                <input
                  type="text"
                  value={editingAppointment.type || ''}
                  onChange={e => setEditingAppointment({ ...editingAppointment, type: e.target.value })}
                  className="w-full border-b border-stone-300 py-2 focus:outline-none focus:border-stone-800 bg-transparent text-stone-800"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setEditingAppointment(null)}
                  className="flex-1 py-3 text-xs uppercase tracking-widest text-stone-500 hover:text-stone-800 border border-stone-200 hover:border-stone-400 transition-colors"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-stone-900 text-white py-3 text-xs uppercase tracking-widest hover:bg-stone-700 transition-colors flex justify-center items-center gap-2"
                >
                  <Save size={14} /> {t('common.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CLIENT FILE MODAL */}
      {selectedClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={() => setSelectedClient(null)}>
          <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full h-[90vh] flex flex-col animate-fade-in overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="bg-stone-900 text-white p-6 flex justify-between items-start">
              <div>
                <h2 className="font-serif text-3xl mb-1">{selectedClient.name}</h2>
                <div className="flex gap-4 text-xs text-stone-400 uppercase tracking-wide">
                  <span className="flex items-center gap-1">
                    <Smartphone size={12} /> {selectedClient.phone || t('admin.clients.noPhone')}
                  </span>
                  <span className="flex items-center gap-1">
                    <Hash size={12} /> {t('admin.clients.codeLabel')} {selectedClient.loginCode}
                  </span>
                </div>
              </div>
              <button onClick={() => setSelectedClient(null)} className="text-stone-400 hover:text-white">
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 bg-stone-50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Client Info */}
                <div className="space-y-6">
                  <div className="bg-white p-6 rounded shadow-sm border border-stone-200">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-serif text-xl text-stone-800 flex items-center gap-2">
                        <Users size={18} /> {t('admin.clients.detailsTitle')}
                      </h3>

                      {!isEditingClientDetails ? (
                        <button
                          onClick={() => setIsEditingClientDetails(true)}
                          className="text-xs uppercase tracking-wide text-stone-500 hover:text-stone-800 flex items-center gap-1"
                        >
                          <Edit2 size={12} /> {t('common.edit')}
                        </button>
                      ) : (
                        <div className="flex gap-2">
                          <button
                            onClick={() => setIsEditingClientDetails(false)}
                            className="text-xs uppercase tracking-wide text-stone-400 hover:text-stone-600"
                          >
                            {t('common.cancel')}
                          </button>
                          <button
                            onClick={handleSaveClientDetails}
                            className="text-xs uppercase tracking-wide text-green-600 hover:text-green-800 font-bold"
                          >
                            {t('common.save')}
                          </button>
                        </div>
                      )}
                    </div>

                    {isEditingClientDetails ? (
                      <div className="space-y-4">
                        <div className="space-y-1">
                          <label className="text-xs text-stone-400 uppercase">{t('admin.clients.form.fullName')}</label>
                          <input
                            type="text"
                            value={editClientFormData.name || ''}
                            onChange={e => setEditClientFormData({ ...editClientFormData, name: e.target.value })}
                            className="w-full border-b border-stone-300 py-1 text-sm focus:outline-none focus:border-stone-800"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs text-stone-400 uppercase">{t('admin.clients.form.email')}</label>
                          <input
                            type="text"
                            value={editClientFormData.email || ''}
                            onChange={e => setEditClientFormData({ ...editClientFormData, email: e.target.value })}
                            className="w-full border-b border-stone-300 py-1 text-sm focus:outline-none focus:border-stone-800"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs text-stone-400 uppercase">{t('admin.clients.form.phone')}</label>
                          <input
                            type="text"
                            value={editClientFormData.phone || ''}
                            onChange={e => setEditClientFormData({ ...editClientFormData, phone: e.target.value })}
                            className="w-full border-b border-stone-300 py-1 text-sm focus:outline-none focus:border-stone-800"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs text-stone-400 uppercase">{t('admin.clients.form.loginCode')}</label>
                          <input
                            type="text"
                            readOnly
                            value={editClientFormData.loginCode || ''}
                            className="w-full border-b border-stone-300 py-1 text-sm bg-stone-50 text-stone-500 cursor-not-allowed"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3 text-sm">
                        <div className="grid grid-cols-3 border-b border-stone-100 pb-2">
                          <span className="text-stone-500">{t('admin.clients.labels.email')}</span>
                          <span className="col-span-2 text-stone-800">{selectedClient.email}</span>
                        </div>
                        <div className="grid grid-cols-3 border-b border-stone-100 pb-2">
                          <span className="text-stone-500">{t('admin.clients.labels.phone')}</span>
                          <span className="col-span-2 text-stone-800">{selectedClient.phone || '-'}</span>
                        </div>
                        <div className="grid grid-cols-3 border-b border-stone-100 pb-2">
                          <span className="text-stone-500">{t('admin.clients.labels.loginCode')}</span>
                          <span className="col-span-2 font-mono bg-stone-100 inline-block px-2 rounded text-stone-800 w-fit">{selectedClient.loginCode}</span>
                        </div>
                        <div className="grid grid-cols-3 border-b border-stone-100 pb-2">
                          <span className="text-stone-500">{t('admin.clients.labels.status')}</span>
                          <span className="col-span-2 capitalize text-stone-800">{selectedClient.status}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="bg-white p-6 rounded shadow-sm border border-stone-200">
                    <h3 className="font-serif text-xl mb-4 text-stone-800 flex items-center gap-2">
                      <Image size={18} /> {t('admin.clients.assignedAlbums')}
                    </h3>
                    <div className="space-y-2">
                      {albums.filter(a => a.clientId === selectedClient.id).map(album => (
                        <div key={album.id} className="flex items-center justify-between p-2 bg-stone-50 rounded border border-stone-100">
                          <span className="text-sm font-medium text-stone-800">{album.title}</span>
                          <button
                            onClick={() => {
                              setSelectedClient(null);
                              setView('gallery');
                              setActiveAlbum(album);
                            }}
                            className="text-xs uppercase tracking-wide text-stone-500 hover:text-stone-900 flex items-center gap-1"
                          >
                            <Eye size={12} /> {t('common.view')}
                          </button>
                        </div>
                      ))}
                      {albums.filter(a => a.clientId === selectedClient.id).length === 0 && (
                        <p className="text-sm text-stone-400 italic">{t('admin.clients.noPrivateAlbums')}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Documents */}
                <div className="space-y-6">
                  <div className="bg-white p-6 rounded shadow-sm border border-stone-200 h-full flex flex-col">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-serif text-xl text-stone-800 flex items-center gap-2">
                        <Paperclip size={18} /> {t('admin.clients.documents')}
                      </h3>
                      <label className="bg-stone-100 hover:bg-stone-200 text-stone-800 px-3 py-1 rounded text-xs uppercase tracking-wide cursor-pointer transition-colors flex items-center gap-1">
                        <Plus size={12} /> {t('admin.clients.attach')}
                        <input type="file" className="hidden" onChange={handleDocumentUpload} />
                      </label>
                    </div>

                    <div className="flex-1 space-y-2 overflow-y-auto max-h-[300px]">
                      {selectedClient.documents && selectedClient.documents.length > 0 ? (
                        selectedClient.documents.map(doc => (
                          <div key={doc.id} className="flex items-center justify-between p-3 border border-stone-100 rounded hover:bg-stone-50 transition-colors group">
                            <div className="flex items-center gap-3 overflow-hidden">
                              <div className="w-8 h-8 bg-stone-200 rounded flex items-center justify-center text-stone-500">
                                {doc.type === 'image' ? <Image size={14} /> : <FileText size={14} />}
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-stone-800 truncate">{doc.name}</p>
                                <p className="text-[10px] text-stone-400 uppercase">
                                  {doc.uploadDate} • {doc.type}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <a href={doc.url} download={doc.name} className="p-1 text-stone-400 hover:text-stone-800">
                                <Download size={16} />
                              </a>
                              <button onClick={() => handleDeleteDocument(doc.id)} className="p-1 text-stone-400 hover:text-red-500">
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="h-32 flex flex-col items-center justify-center text-stone-400 border-2 border-dashed border-stone-100 rounded">
                          <FileText size={24} className="mb-2 opacity-50" />
                          <p className="text-sm italic">{t('admin.clients.noDocuments')}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
