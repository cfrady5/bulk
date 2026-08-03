/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // this app lives in web/ inside a monorepo with the Expo app at the root
  outputFileTracingRoot: import.meta.dirname,
  eslint: {
    // Lint is run separately (npm run lint); don't block builds on it.
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      // Supabase Storage public/signed photo URLs
      { protocol: 'https', hostname: '*.supabase.co' },
    ],
  },
};

export default nextConfig;
