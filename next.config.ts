import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // 開発環境では basePath と assetPrefix を無効化
  ...(process.env.NODE_ENV === 'production' ? {
    basePath: '/pixel-work',
    assetPrefix: '/pixel-work/',
  } : {})
}

export default nextConfig
