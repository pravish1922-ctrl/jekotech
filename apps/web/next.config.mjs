/** @type {import('next').NextConfig} */
const config = {
  transpilePackages: ['@jekotech/ui', '@jekotech/types'],
  images: {
    remotePatterns: [
      {
        // Supabase Storage — booking-photos bucket
        protocol: 'https',
        hostname: '**.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
}

export default config
