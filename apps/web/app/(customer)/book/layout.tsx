import type { ReactNode } from 'react'
import { BookingProvider } from './booking-context'
import { BookingFooter } from './booking-footer'

export default function BookingLayout({ children }: { children: ReactNode }) {
  return (
    <BookingProvider>
      <div className="min-h-screen bg-ink max-w-md mx-auto pb-28">
        {children}
      </div>
      <BookingFooter />
    </BookingProvider>
  )
}
