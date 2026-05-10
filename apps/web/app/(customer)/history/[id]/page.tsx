import Link from 'next/link'
import { BottomNav } from '../../../../components/ui/bottom-nav'

export default function BookingDetailPage() {
  return (
    <>
      <main className="min-h-screen bg-ink max-w-md mx-auto pb-20 px-6 pt-10">
        <Link
          href="/history"
          className="font-mono text-[10px] tracking-mono uppercase text-steel2 hover:text-bone transition-colors duration-120 mb-8 inline-block"
        >
          ← BACK TO LOG
        </Link>
        <p className="font-mono text-[10px] tracking-mono uppercase text-steel3">
          Booking detail — coming soon
        </p>
      </main>
      <BottomNav />
    </>
  )
}
