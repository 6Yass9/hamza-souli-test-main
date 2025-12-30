import { Appointment, GalleryItem, User, Album, ClientDocument } from '../types';
import { supabase } from './supabaseClient';

// helpers to map DB rows -> TS types

const mapUser = (row: any): User => ({
  id: row.id,
  name: row.name,
  email: row.email ?? undefined,
  phone: row.phone ?? '',
  role: row.role,
  status: row.status ?? 'active',
  loginCode: row.login_code ?? undefined,
  documents: [] // loaded separately
});

const mapAppointment = (row: any): Appointment => ({
  id: row.id,
  date: row.date,
  time: row.time ?? '',
  clientName: row.client_name,
  status: row.status,
  type: row.type ?? '',
  staffId: row.user_id ?? undefined // ✅ maps to appointments.user_id
});

const mapAlbum = (row: any): Album => ({
  id: row.id,
  title: row.title,
  clientId: row.client_id ?? undefined,
  coverUrl: row.cover_url ?? '',
  createdAt: row.created_at
});

const mapGalleryItem = (row: any): GalleryItem => ({
  id: row.id,
  albumId: row.album_id,
  url: row.url,
  title: row.title ?? ''
});

const mapClientDocument = (row: any): ClientDocument => {
  const uploadedAt: string = row.uploaded_at ?? row.created_at ?? '';
  const uploadDate =
    typeof uploadedAt === 'string' && uploadedAt.includes('T') ? uploadedAt.split('T')[0] : uploadedAt || '';

  return {
    id: row.id,
    name: row.name,
    url: row.url,
    type: row.type,
    uploadDate
  };
};

const generateError = (prefix: string, error: any) => {
  console.error(prefix, error);
  throw new Error(prefix);
};

export const api = {
  // --- Auth ---

  // ✅ Unified login for Admin + Staff (email + password)
  loginStaffOrAdmin: async (email: string, password: string) => {
  const res = await fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'staff', email, password }),
  });

  if (!res.ok) return null;

  const { token, user } = await res.json();
  localStorage.setItem('app_token', token);
  return user;
},


  loginClient: async (code: string) => {
  const res = await fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'client', code }),
  });

  if (!res.ok) return null;

  const { token, user } = await res.json();
  localStorage.setItem('app_token', token);
  return user;
},


  // --- Staff (NEW) ---

  getStaff: async (): Promise<User[]> => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'staff')
      .order('created_at', { ascending: false });

    if (error || !data) {
      console.error('getStaff error', error);
      return [];
    }
    return data.map(mapUser);
  },

  createStaff: async (firstName: string, familyName: string, email: string, password: string, phone?: string): Promise<User> => {
    const fn = firstName?.trim();
    const ln = familyName?.trim();
    const cleanEmail = email?.trim().toLowerCase();
    const cleanPassword = password;
    const cleanPhone = phone?.trim() ? phone.trim() : null;

    if (!fn || !ln) throw new Error('First name and family name are required');
    if (!cleanEmail) throw new Error('Email is required');
    if (!cleanPassword) throw new Error('Password is required');

    // optional: check email uniqueness
    const { data: existing, error: existingError } = await supabase().from('users').select('id').eq('email', cleanEmail).maybeSingle();

    if (existingError) {
      console.error('Failed to check staff email', existingError);
      throw new Error(existingError.message || 'Failed to validate staff email');
    }
    if (existing) throw new Error('Email already in use');

    const fullName = `${fn} ${ln}`.trim();

    const { data, error } = await supabase
      .from('users')
      .insert({
        name: fullName,
        email: cleanEmail,
        password: cleanPassword,
        phone: cleanPhone,
        role: 'staff',
        status: 'active'
      })
      .select('*')
      .single();

    if (error || !data) {
      console.error('Failed to create staff', error);
      throw new Error(error?.message || 'Failed to create staff member');
    }

    return mapUser(data);
  },

  // --- Clients ---

  getClients: async (): Promise<User[]> => {
    const { data, error } = await supabase().from('users').select('*').eq('role', 'client').order('created_at', { ascending: false });

    if (error || !data) {
      console.error('getClients error', error);
      return [];
    }
    return data.map(mapUser);
  },

  createClient: async (name: string, email?: string, phone?: string, loginCode?: string): Promise<User> => {
    const cleanName = name?.trim();
    const cleanLoginCode = loginCode?.trim();

    if (!cleanName || !cleanLoginCode) throw new Error('Name and login code are required');

    const cleanEmail = email?.trim() ? email.trim() : null;
    const cleanPhone = phone?.trim() ? phone.trim() : null;

    const { data: existing, error: existingError } = await supabase().from('users').select('id').eq('login_code', cleanLoginCode).maybeSingle();

    if (existingError) {
      console.error('Failed to check login code', existingError);
      throw new Error(existingError.message || 'Failed to validate login code');
    }
    if (existing) throw new Error('Login code already in use');

    const { data, error } = await supabase
      .from('users')
      .insert({
        name: cleanName,
        email: cleanEmail,
        phone: cleanPhone,
        role: 'client',
        status: 'active',
        login_code: cleanLoginCode
      })
      .select('*')
      .single();

    if (error || !data) {
      console.error('Failed to create client', error);
      throw new Error(error?.message || 'Failed to create client');
    }

    return mapUser(data);
  },

  updateClient: async (id: string, updates: Partial<User>): Promise<User | null> => {
    const payload: any = {};
    if (updates.name !== undefined) payload.name = updates.name;
    if (updates.email !== undefined) payload.email = updates.email;
    if (updates.phone !== undefined) payload.phone = updates.phone;
    if (updates.status !== undefined) payload.status = updates.status;
    if (updates.loginCode !== undefined) payload.login_code = updates.loginCode;

    const { data, error } = await supabase().from('users').update(payload).eq('id', id).select('*').maybeSingle();

    if (error) {
      console.error('updateClient error', error);
      return null;
    }
    if (!data) return null;

    return mapUser(data);
  },

  archiveClient: async (id: string): Promise<void> => {
    const { error } = await supabase().from('users').update({ status: 'archived' }).eq('id', id);
    if (error) generateError('Failed to archive client', error);
  },

  unarchiveClient: async (id: string): Promise<void> => {
    const { error } = await supabase().from('users').update({ status: 'active' }).eq('id', id);
    if (error) generateError('Failed to unarchive client', error);
  },

  uploadDocument: async (clientId: string, name: string, dataUrl: string, type: ClientDocument['type']): Promise<ClientDocument | null> => {
    const { data, error } = await supabase
      .from('client_documents')
      .insert({
        user_id: clientId,
        name,
        url: dataUrl,
        type
      })
      .select('*')
      .single();

    if (error || !data) {
      console.error('uploadDocument error', error);
      return null;
    }

    return mapClientDocument(data);
  },

  deleteDocument: async (clientId: string, docId: string): Promise<void> => {
    const { error } = await supabase().from('client_documents').delete().eq('user_id', clientId).eq('id', docId);
    if (error) generateError('Failed to delete document', error);
  },

  getClientDocuments: async (clientId: string): Promise<ClientDocument[]> => {
    const { data, error } = await supabase().from('client_documents').select('*').eq('user_id', clientId).order('uploaded_at', { ascending: false });

    if (error || !data) {
      console.error('getClientDocuments error', error);
      return [];
    }

    return data.map(mapClientDocument);
  },

  // --- Appointments ---

  getAppointments: async (): Promise<Appointment[]> => {
    const { data, error } = await supabase().from('appointments').select('*').order('date', { ascending: true });
    if (error || !data) {
      console.error('getAppointments error', error);
      return [];
    }
    return data.map(mapAppointment);
  },

  getBookedDates: async (): Promise<string[]> => {
    const { data, error } = await supabase().from('appointments').select('date, status');
    if (error || !data) {
      console.error('getBookedDates error', error);
      return [];
    }

    return data
      .filter((a: any) => a.status === 'pending' || a.status === 'confirmed' || !a.status)
      .map((a: any) => a.date);
  },

  createAppointment: async (date: string, name: string, phone: string) => {
  if (!date || !name || !phone) {
    throw new Error('Missing required fields');
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (new Date(date) < today) {
    throw new Error('Cannot book in the past');
  }

  const payload = {
    date,
    time: '10:00',
    client_name: name.trim(),
    phone: phone.trim(),
    status: 'pending',
    type: 'Consultation Request'
  };

  const { error } = await supabase().from('appointments').insert(payload);
  if (error) generateError('Failed to create appointment', error);

  return { success: true };
},


  updateAppointment: async (id: string, updates: Partial<Appointment>): Promise<Appointment | null> => {
    const payload: any = {};
    if (updates.date !== undefined) payload.date = updates.date;
    if (updates.time !== undefined) payload.time = updates.time;
    if (updates.clientName !== undefined) payload.client_name = updates.clientName;
    if (updates.status !== undefined) payload.status = updates.status;
    if (updates.type !== undefined) payload.type = updates.type;

    // ✅ staff assignment stored in appointments.user_id
    if (updates.staffId !== undefined) payload.user_id = updates.staffId || null;

    const { data, error } = await supabase().from('appointments').update(payload).eq('id', id).select('*').maybeSingle();

    if (error) {
      console.error('updateAppointment error', error);
      return null;
    }
    if (!data) return null;

    return mapAppointment(data);
  },

  // --- Albums & Gallery ---
  // --- Public Portfolio ---

  getPublicAlbums: async (): Promise<Album[]> => {
    const { data, error } = await supabase().from('albums').select('*').is('client_id', null).order('created_at', { ascending: false });

    if (error || !data) {
      console.error('getPublicAlbums error', error);
      return [];
    }

    return data.map(mapAlbum);
  },

  getPublicPhotos: async (): Promise<GalleryItem[]> => {
    const { data, error } = await supabase
      .from('gallery_items')
      .select('*, albums!inner(client_id)')
      .is('albums.client_id', null)
      .order('created_at', { ascending: false });

    if (error || !data) {
      console.error('getPublicPhotos error', error);
      return [];
    }

    return (data as any[]).map(mapGalleryItem);
  },

  getAlbums: async (): Promise<Album[]> => {
    const { data, error } = await supabase().from('albums').select('*').order('created_at', { ascending: false });
    if (error || !data) {
      console.error('getAlbums error', error);
      return [];
    }
    return data.map(mapAlbum);
  },

  getClientAlbums: async (clientId: string): Promise<Album[]> => {
    const { data, error } = await supabase().from('albums').select('*').eq('client_id', clientId).order('created_at', { ascending: false });

    if (error || !data) {
      console.error('getClientAlbums error', error);
      return [];
    }
    return data.map(mapAlbum);
  },

  createAlbum: async (title: string, clientId?: string): Promise<Album> => {
    const normalizedClientId = clientId?.trim() ? clientId.trim() : null;

    const { data, error } = await supabase
      .from('albums')
      .insert({
        title,
        client_id: normalizedClientId
      })
      .select('*')
      .single();

    if (error || !data) generateError('Failed to create album', error);
    return mapAlbum(data);
  },

  deleteAlbum: async (id: string): Promise<void> => {
    const { error } = await supabase().from('albums').delete().eq('id', id);
    if (error) generateError('Failed to delete album', error);
  },

  getGalleryByAlbum: async (albumId: string): Promise<GalleryItem[]> => {
    const { data, error } = await supabase().from('gallery_items').select('*').eq('album_id', albumId).order('created_at', { ascending: true });

    if (error || !data) {
      console.error('getGalleryByAlbum error', error);
      return [];
    }
    return data.map(mapGalleryItem);
  },

  getAllPhotos: async (): Promise<GalleryItem[]> => {
    const { data, error } = await supabase().from('gallery_items').select('*').order('created_at', { ascending: false });
    if (error || !data) {
      console.error('getAllPhotos error', error);
      return [];
    }
    return data.map(mapGalleryItem);
  },

  getClientGallery: async (clientId: string): Promise<GalleryItem[]> => {
    const { data, error } = await supabase().from('gallery_items').select('*, albums!inner(client_id)').eq('albums.client_id', clientId);

    if (error || !data) {
      console.error('getClientGallery error', error);
      return [];
    }
    return (data as any[]).map(mapGalleryItem);
  },

  addGalleryItem: async (albumId: string, url: string, title?: string): Promise<GalleryItem> => {
    const { data, error } = await supabase
      .from('gallery_items')
      .insert({
        album_id: albumId,
        url,
        title: title ?? null
      })
      .select('*')
      .single();

    if (error || !data) generateError('Failed to add gallery item', error);

    const { data: album, error: albumError } = await supabase().from('albums').select('*').eq('id', albumId).maybeSingle();

    if (!albumError && album && !album.cover_url) {
      await supabase().from('albums').update({ cover_url: url }).eq('id', albumId);
    }

    return mapGalleryItem(data);
  },

  deleteGalleryItem: async (id: string): Promise<void> => {
    const { error } = await supabase().from('gallery_items').delete().eq('id', id);
    if (error) generateError('Failed to delete gallery item', error);
  },

  getGallery: async (albumId?: string): Promise<GalleryItem[]> => {
    if (albumId) return api.getGalleryByAlbum(albumId);
    return api.getAllPhotos();
  },

  // --- Reviews (stub) ---
  submitReview: async (clientId: string, review: string) => {
    console.log(`Review from ${clientId}: ${review}`);
    return { success: true };
  }
};

export default api;
