'use server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@supabase/supabase-js'

export async function updateBooking(
  bookingId: string,
  updates: Record<string, unknown>
) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  )
  const { error } = await supabase
    .from('bookings')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', bookingId)

  if (error) return { error: error.message }

  revalidatePath('/admin/bookings')
  revalidatePath(`/admin/bookings/${bookingId}`)
  revalidatePath('/admin/analytics')
  return { success: true }
}
