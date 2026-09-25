/** @type {import('next').NextConfig} */
const nextConfig = {
  // Nothing custom needed yet. If we later load profile photos from
  // Vercel Blob's public URLs with next/image, we'll add their hostname
  // here under `images.remotePatterns` — Next.js blocks external image
  // domains by default as a security measure.
};

module.exports = nextConfig;
