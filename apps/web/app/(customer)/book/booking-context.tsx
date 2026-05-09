'use client'

import { createContext, useContext, useState, type ReactNode } from 'react'

// ── State shape ───────────────────────────────────────────────────────────────

interface BookingState {
  serviceId:       string
  serviceName:     string
  servicePrice:    number
  serviceDuration: number
  date:            string   // "YYYY-MM-DD"
  time:            string   // "HH:MM"
  vehicleId:       string
  registration:    string
  make:            string
  model:           string
  year:            number
  mileage:         number
  notes:           string
  photoUrls:       string[]
  canProceed:      boolean
}

interface BookingActions {
  setService(id: string, name: string, price: number, duration: number): void
  setDateTime(date: string, time: string): void
  setVehicle(id: string, reg: string, make: string, model: string, year: number, mileage: number): void
  setNotes(notes: string): void
  addPhoto(url: string): void
  removePhoto(url: string): void
  setCanProceed(v: boolean): void
  reset(): void
}

type BookingContextValue = BookingState & BookingActions

// ── Defaults ──────────────────────────────────────────────────────────────────

const INITIAL: BookingState = {
  serviceId: '', serviceName: '', servicePrice: 0, serviceDuration: 0,
  date: '', time: '',
  vehicleId: '', registration: '', make: '', model: '', year: 0, mileage: 0,
  notes: '', photoUrls: [],
  canProceed: false,
}

// ── Context ───────────────────────────────────────────────────────────────────

const BookingContext = createContext<BookingContextValue | null>(null)

export function BookingProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<BookingState>(INITIAL)

  function patch(update: Partial<BookingState>) {
    setState(s => ({ ...s, ...update }))
  }

  const actions: BookingActions = {
    setService(id, name, price, duration) {
      patch({ serviceId: id, serviceName: name, servicePrice: price, serviceDuration: duration })
    },
    setDateTime(date, time) {
      patch({ date, time })
    },
    setVehicle(id, reg, make, model, year, mileage) {
      patch({ vehicleId: id, registration: reg, make, model, year, mileage })
    },
    setNotes(notes) {
      patch({ notes })
    },
    addPhoto(url) {
      setState(s => ({ ...s, photoUrls: [...s.photoUrls, url] }))
    },
    removePhoto(url) {
      setState(s => ({ ...s, photoUrls: s.photoUrls.filter(u => u !== url) }))
    },
    setCanProceed(v) {
      patch({ canProceed: v })
    },
    reset() {
      setState(INITIAL)
    },
  }

  return (
    <BookingContext.Provider value={{ ...state, ...actions }}>
      {children}
    </BookingContext.Provider>
  )
}

export function useBooking(): BookingContextValue {
  const ctx = useContext(BookingContext)
  if (!ctx) throw new Error('useBooking must be inside <BookingProvider>')
  return ctx
}
