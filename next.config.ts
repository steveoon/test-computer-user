import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  webpack(config, { isServer, dev }) {
    // 🎯 添加tiktoken WASM支持 (遵循tiktoken文档)
    config.experiments = {
      asyncWebAssembly: true,
      layers: true,
    };

    // 🔧 Vercel部署优化：复制WASM文件到正确位置
    if (isServer && !dev) {
      // 在生产构建时确保WASM文件被正确处理
      config.externals = config.externals || [];
      config.externals.push({
        "tiktoken/tiktoken_bg.wasm": "tiktoken/tiktoken_bg.wasm",
      });
    }

    // 🔧 WASM模块解析优化
    config.module.rules.push({
      test: /\.wasm$/,
      type: "asset/resource",
      generator: {
        filename: "static/wasm/[name].[hash][ext]",
      },
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
