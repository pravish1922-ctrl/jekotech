export default function AdminAnalyticsPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#0B0D0E', paddingBottom: 80 }}>
      <div
        className="px-6 py-5"
        style={{ borderBottom: '1px solid #2A2F33' }}
      >
        <h1
          className="text-xl font-bold"
          style={{ color: '#F2EFEA', fontFamily: 'Space Grotesk, sans-serif', letterSpacing: '-0.02em' }}
        >
          ANALYTICS
        </h1>
        <p className="text-xs mt-0.5" style={{ color: '#F2EFEA66', fontFamily: 'JetBrains Mono, monospace' }}>
          COMING SOON
        </p>
      </div>

      <div className="px-6 py-16 text-center">
        <p className="text-sm" style={{ color: '#F2EFEA33', fontFamily: 'JetBrains Mono, monospace' }}>
          REVENUE AND BOOKING ANALYTICS WILL APPEAR HERE
        </p>
      </div>
    </div>
  )
}
