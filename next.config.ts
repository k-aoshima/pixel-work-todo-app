import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // 開発環境では basePath と assetPrefix を無効化
  env: {
    // Explicitly define public env vars for the build process
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },
}

export default nextConfig
