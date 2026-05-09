// (admin) route group — desktop console, role = 'owner' required.
// Auth check goes here via Supabase session + RLS role claim.
// TODO: redirect to /login if no session or role !== 'owner'
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-ink2 text-bone flex">
      {/* Sidebar + main content added in admin pages */}
      {children}
    </div>
  )
}
