/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,  // Ubah ke false untuk menghindari double-mounting
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value:
              "default-src 'self'; script-src 'self' 'unsafe-eval' https://cdn.jsdelivr.net; connect-src 'self' blob: https://cdn.jsdelivr.net; worker-src 'self' blob:; style-src 'self' 'unsafe-inline'; img-src 'self' data:; media-src 'self' blob:; font-src 'self' https://fonts.googleapis.com https://fonts.gstatic.com; frame-src 'self'"
          }
        ]
      }
    ];
  }
};

module.exports = nextConfig;