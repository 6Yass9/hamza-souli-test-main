export interface ServicePackage {
  id: string;
  title: string;
  price?: string; // optional
  description: string;
  features: string[];
}

export interface PortfolioItem {
  id: string;
  src: string;
  category: string;
  alt: string;
}

export interface Testimonial {
  id: string;
  couple: string;
  quote: string;
  date: string;
}

export interface ClientDocument {
  id: string;
  name: string;
  url: string;
  uploadDate: string;
  type: 'pdf' | 'image' | 'doc' | 'other';
}

export interface User {
  id: string;
  name: string;
  email?: string;
  role: 'admin' | 'staff' | 'client';
  status?: 'active' | 'archived';
  phone?: string;
  loginCode?: string; // 6-digit access code for clients
  documents?: ClientDocument[]; // loaded separately
}

export interface Appointment {
  id: string;

  // Your DB schema: appointments.user_id references users(id)
  // We use this in UI as "assigned staff"
  staffId?: string | null;

  // basic fields
  date: string; // YYYY-MM-DD
  time?: string | null;
  clientName: string;
  email?: string;

  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  type: string;
}

export interface Album {
  id: string;
  title: string;
  coverUrl: string;
  createdAt: string;
  clientId?: string; // if private
}

export interface GalleryItem {
  id: string;
  url: string;
  title: string;
  albumId?: string;
}
