const internalHost = process.env.API_INTERNAL_HOST || '127.0.0.1';
const internalPort = Number(process.env.API_INTERNAL_PORT || 3001);

function normalizeApiOrigin(rawOrigin) {
    const trimmed = String(rawOrigin || '').trim().replace(/\/$/, '');
    if (!trimmed) return `http://${internalHost}:${internalPort}`;

    try {
        const url = new URL(trimmed);
        const host = String(url.hostname || '').toLowerCase();
        const isLocalHost = host === 'localhost' || host === '127.0.0.1' || host === '::1';
        if (isLocalHost && url.protocol === 'https:') {
            url.protocol = 'http:';
        }
        return url.toString().replace(/\/$/, '');
    } catch (_error) {
        return trimmed;
    }
}

const apiOrigin = normalizeApiOrigin(
    process.env.API_ORIGIN ||
    `http://${internalHost}:${internalPort}`
);

/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    async rewrites() {
        return {
            // Keep Next app routes (e.g. /api/auth/* in app router) first,
            // and proxy only when no local route matches.
            fallback: [
                {
                    source: '/api/:path*',
                    destination: `${apiOrigin}/api/:path*`,
                },
            ],
        };
    },
};
export default nextConfig;
