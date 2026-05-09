// packages/types/index.ts
// Exact copy of design/pwa-prototype/types.ts — single source of truth for shared types

export type ServiceType =
  | 'full_service' | 'interim_service' | 'mot' | 'diagnostics'
  | 'brakes' | 'tyres' | 'aircon' | 'bodywork' | 'other';

export interface Service {
  id: string;
  type: ServiceType;
  name: string;
  description: string;
  basePriceGbp: number;
  estimatedDurationMin: number;
}

export interface Vehicle {
  id: string;
  qbVehicleId?: string;
  registration: string;
  make: string;
  model: string;
  year: number;
  colour?: string;
  vin?: string;
  mileage: number;
  ownerClientId: string;
  motDueDate?: string;
}

export interface Client {
  id: string;
  qbCustomerId?: string;
  name: string;
  email: string;
  phone: string;
  whatsappOptIn: boolean;
  vehicles: Vehicle[];
  createdAt: string;
}

export interface Mechanic {
  id: string;
  name: string;
  initials: string;
  specialties: string[];
  maxConcurrentJobs: number;
  active: boolean;
  colorHex: string;
}

export type BookingStatus =
  | 'pending'
  | 'confirmed'
  | 'in_progress'
  | 'complete'
  | 'cancelled';

export interface Booking {
  id: string;
  reference: string;
  clientId: string;
  vehicleId: string;
  serviceIds: string[];
  bayNumber: 1 | 2 | 3 | 4;
  scheduledStart: string;
  scheduledEnd: string;
  status: BookingStatus;
  assignedMechanicId?: string;
  customerNotes?: string;
  photoUrls: string[];
  estimatedCostGbp: number;
  finalCostGbp?: number;
  qbInvoiceId?: string;
  airtableRecordId?: string;
  whatsappThreadId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AvailabilityDay {
  date: string;
  totalSlots: number;
  bookedSlots: number;
  slots: Array<{
    time: string;
    bay: 1 | 2 | 3 | 4;
    available: boolean;
    bookingRef?: string;
  }>;
}

export interface WhatsAppMessage {
  id: string;
  direction: 'in' | 'out';
  to: string;
  bodyText: string;
  templateName?: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  bookingRef?: string;
  sentAt: string;
}
