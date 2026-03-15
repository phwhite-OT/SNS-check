/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    async rewrites() {
        return {
            // Keep Next.js Route Handlers (e.g. /api/auth/*) as-is,
            // and proxy the rest of /api/* to the internal Express API.
            afterFiles: [
                {
                    source: '/api/:path*',
                    destination: 'http://127.0.0.1:3001/api/:path*',
                },
            ],
        };
    },
};
export default nextConfig;
