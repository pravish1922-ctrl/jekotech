'use client'

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

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

  // Stable references via useCallback (setState from useState is always stable)
  const setService = useCallback((id: string, name: string, price: number, duration: number) => {
    setState(s => ({ ...s, serviceId: id, serviceName: name, servicePrice: price, serviceDuration: duration }))
  }, [])

  const setDateTime = useCallback((date: string, time: string) => {
    setState(s => ({ ...s, date, time }))
  }, [])

  const setVehicle = useCallback((id: string, reg: string, make: string, model: string, year: number, mileage: number) => {
    setState(s => ({ ...s, vehicleId: id, registration: reg, make, model, year, mileage }))
  }, [])

  const setNotes = useCallback((notes: string) => {
    setState(s => ({ ...s, notes }))
  }, [])

  const addPhoto = useCallback((url: string) => {
    setState(s => ({ ...s, photoUrls: [...s.photoUrls, url] }))
  }, [])

  const removePhoto = useCallback((url: string) => {
    setState(s => ({ ...s, photoUrls: s.photoUrls.filter(u => u !== url) }))
  }, [])

  const setCanProceed = useCallback((v: boolean) => {
    setState(s => ({ ...s, canProceed: v }))
  }, [])

  const reset = useCallback(() => {
    setState(INITIAL)
  }, [])

  const value: BookingContextValue = {
    ...state,
    setService,
    setDateTime,
    setVehicle,
    setNotes,
    addPhoto,
    removePhoto,
    setCanProceed,
    reset,
  }

  return (
    <BookingContext.Provider value={value}>
      {children}
    </BookingContext.Provider>
  )
}

export function useBooking(): BookingContextValue {
  const ctx = useContext(BookingContext)
  if (!ctx) throw new Error('useBooking must be inside <BookingProvider>')
  return ctx
}
