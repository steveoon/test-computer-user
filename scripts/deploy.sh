#!/bin/bash

# 部署脚本 - 构建并推送到 GitHub Container Registry

set -e

echo "🚀 开始部署流程..."

# 安全检查：确保 .env 文件不会被包含在镜像中
if ! grep -q "^\.env$" .dockerignore; then
    echo "❌ 错误：.dockerignore 文件中没有包含 .env"
    echo "这可能导致敏感信息被打包进 Docker 镜像！"
    echo "请检查 .dockerignore 文件"
    exit 1
fi

# 构建时需要的 NEXT_PUBLIC_ 环境变量
if [ -f .env ]; then
    echo "📋 加载构建时需要的环境变量..."
    # 只导出 NEXT_PUBLIC_ 开头的变量
    export $(grep -E '^NEXT_PUBLIC_' .env | xargs)
fi

# 1. 构建 Docker 镜像
echo "📦 构建 Docker 镜像 (linux/amd64)..."
docker build --no-cache . --platform linux/amd64 \
  --build-arg NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL \
  --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY \
  -t ghcr.io/steveoon/ai-computer-use:latest

# 2. 推送到 GitHub Container Registry
echo "⬆️  推送镜像到 ghcr.io..."
docker push ghcr.io/steveoon/ai-computer-use:latest

echo "✅ 部署完成!"
echo ""
echo "🖥️  在 VPS 上运行以下命令部署："
echo ""
echo "1. 准备环境变量文件："
echo "   创建 .env 文件，包含所有必要的环境变量（参考 .env.example）"
echo ""
echo "2. 拉取最新镜像："
echo "   docker pull ghcr.io/steveoon/ai-computer-use:latest"
echo ""
echo "3. 使用 docker-compose 启动（推荐）："
echo "   docker-compose -f docker-compose.prod.yml up -d"
echo ""
echo "4. 或者直接使用 docker run："
echo "   docker run -d \\"
echo "     --name ai-computer-use \\"
echo "     --restart always \\"
echo "     -p 4000:3000 \\"
echo "     --env-file .env \\"
echo "     ghcr.io/steveoon/ai-computer-use:latest"
echo ""
echo "⚠️  重要提醒："
echo "   - 确保 VPS 上有正确的 .env 文件"
echo "   - 不要将 .env 文件提交到代码仓库"
echo "   - 定期更新环境变量和镜像"