import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  webpack(config, { isServer }) {
    // 🎯 添加tiktoken WASM支持
    config.experiments = {
      asyncWebAssembly: true,
      layers: true,
      // 🔧 确保支持顶级await
      topLevelAwait: true,
    };

    // 🔧 WASM文件处理规则
    config.module.rules.push({
      test: /\.wasm$/,
      type: "webassembly/async",
    });

    // 🔧 确保Node.js polyfill (主要针对client side)
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
      };
    }

    return config;
  },

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "frame-src https://*.e2b.dev https://*.e2b.app https://va.vercel-scripts.com",
              "frame-ancestors 'self' https://*.e2b.dev https://*.e2b.app",
              "connect-src 'self' https://*.e2b.dev https://*.e2b.app",
              "img-src 'self' data: https://*.e2b.dev https://*.e2b.app",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.e2b.dev https://*.e2b.app https://va.vercel-scripts.com",
              "style-src 'self' 'unsafe-inline'",
            ].join("; "),
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
