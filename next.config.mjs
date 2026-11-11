/** @type {import('next').NextConfig} */
const nextConfig = {
    // В Docker (Dockerfile ставит NEXT_OUTPUT=standalone) – самодостаточный server.js без node_modules целиком.
    // Dev и Vercel собираются как раньше
    output: process.env.NEXT_OUTPUT === 'standalone' ? 'standalone' : undefined,
    webpack(config) {
      config.module.rules.push({
        test: /\.svg$/,
        use: ["@svgr/webpack"],
      });
      return config;
    },
  };


export default nextConfig;
