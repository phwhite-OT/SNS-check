const apiOrigin = (
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.API_ORIGIN ||
    'http://127.0.0.1:3001'
).replace(/\/$/, '');

/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    async rewrites() {
        return {
            afterFiles: [
                {
                    source: '/api/:path*',
                    destination: `${apiOrigin}/api/:path*`,
                },
            ],
        };
    },
};
export default nextConfig;
