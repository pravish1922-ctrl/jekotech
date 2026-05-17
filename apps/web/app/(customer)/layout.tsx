import { PreviewBanner } from '../../components/admin/preview-banner'

// (customer) route group — auth + app screens share no chrome at this level.
// Authenticated app screens nest under (customer)/(app)/layout.tsx (bottom nav lives there).
export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PreviewBanner />
      {children}
    </>
  )
}
