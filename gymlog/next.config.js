/** @type {import('next').NextConfig} */

const withPWA = require("next-pwa")({
  dest: "public",
  register: true,
  skipWaiting: true,

  // Desactiva PWA en desarrollo (evita bugs y locks en Windows)
  disable: process.env.NODE_ENV === "development",

  // Evita conflictos con archivos internos de Next
  buildExcludes: [/middleware-manifest\.json$/],

  runtimeCaching: [
    // Cache SOLO de assets estáticos (seguro)
    {
      urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico|woff2?)$/,
      handler: "CacheFirst",
      options: {
        cacheName: "static-assets",
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 días
        },
      },
    },
  ],
});

const nextConfig = {
  reactStrictMode: true,
};

module.exports = withPWA(nextConfig);
