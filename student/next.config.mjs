/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    const rawBackendUrl =
      process.env.NEXT_PUBLIC_API_BASE_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      process.env.BACKEND_URL ||
      '';

    if (!rawBackendUrl) return [];

    const targetUrl = rawBackendUrl.trim().replace(/\/$/, '').replace(/\/api\/v1$/, '');

    return [
      {
        source: '/api/v1/:path*',
        destination: `${targetUrl}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
