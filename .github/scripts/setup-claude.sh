#!/bin/bash

# Claude Code 统一安装和配置脚本
# 支持本地开发、GitHub Actions 和自托管 Runner 环境

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🤖 Claude Code Setup Script"
echo "=========================="
echo ""

# 检测运行环境
detect_environment() {
    if [[ -n "$GITHUB_ACTIONS" ]]; then
        echo "📍 Running in GitHub Actions"
        ENV_TYPE="github-actions"
    elif [[ -f /.dockerenv ]]; then
        echo "📍 Running in Docker container"
        ENV_TYPE="docker"
    else
        echo "📍 Running in local environment"
        ENV_TYPE="local"
    fi
}

# 检查并安装 Node.js
install_nodejs() {
    echo "📦 Checking Node.js installation..."
    
    if command -v node >/dev/null 2>&1; then
        NODE_VERSION=$(node -v)
        echo "✅ Node.js is already installed: $NODE_VERSION"
        
        # 检查版本是否足够新（至少 v18）
        NODE_MAJOR=$(echo "$NODE_VERSION" | cut -d. -f1 | sed 's/v//')
        if [ "$NODE_MAJOR" -lt 18 ]; then
            echo -e "${YELLOW}⚠️  Node.js version is too old. Installing newer version...${NC}"
            INSTALL_NODE=true
        else
            return 0
        fi
    else
        INSTALL_NODE=true
    fi
    
    if [ "$INSTALL_NODE" = true ]; then
        echo "📥 Installing Node.js v20..."
        
        # 检测包管理器并安装
        if command -v apt-get >/dev/null 2>&1; then
            # Debian/Ubuntu
            curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
            sudo apt-get install -y nodejs
        elif command -v yum >/dev/null 2>&1; then
            # RHEL/CentOS
            curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
            sudo yum install -y nodejs
        elif command -v brew >/dev/null 2>&1; then
            # macOS
            brew install node
        else
            echo -e "${RED}❌ Unsupported package manager. Please install Node.js manually.${NC}"
            echo "Visit: https://nodejs.org/"
            return 1
        fi
    fi
    
    echo "✅ Node.js $(node -v) installed"
    echo "✅ npm $(npm -v) installed"
}

# 安装 Claude Code CLI
install_claude_cli() {
    echo ""
    echo "📦 Installing Claude Code CLI..."
    
    # 检查是否已安装
    if command -v claude >/dev/null 2>&1; then
        echo "✅ Claude CLI is already installed"
        claude --version 2>/dev/null || echo "Version: $(npm list -g @anthropic-ai/claude-code 2>/dev/null | grep @anthropic-ai/claude-code || echo 'installed')"
        
        if [[ "$ENV_TYPE" != "github-actions" ]]; then
            echo ""
            read -p "Do you want to update to the latest version? (y/n): " -n 1 -r
            echo ""
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                npm update -g @anthropic-ai/claude-code
            fi
        fi
        return 0
    fi
    
    echo "📥 Installing @anthropic-ai/claude-code..."
    
    # 尝试全局安装
    if npm install -g @anthropic-ai/claude-code 2>/dev/null; then
        echo "✅ Claude Code installed successfully!"
    else
        # 如果失败，尝试使用 sudo
        echo "💡 Trying with sudo..."
        if sudo npm install -g @anthropic-ai/claude-code 2>/dev/null; then
            echo "✅ Claude Code installed successfully!"
        else
            # 最后尝试用户级安装
            echo "💡 Installing to user directory..."
            mkdir -p ~/.npm-global
            npm config set prefix '~/.npm-global'
            export PATH=~/.npm-global/bin:$PATH
            echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
            
            if npm install -g @anthropic-ai/claude-code; then
                echo "✅ Claude Code installed to user directory"
                echo -e "${YELLOW}⚠️  Please ensure PATH includes: ~/.npm-global/bin${NC}"
            else
                echo -e "${RED}❌ Installation failed${NC}"
                return 1
            fi
        fi
    fi
    
    # 验证安装
    if command -v claude >/dev/null 2>&1; then
        echo "✅ Claude CLI is available"
    else
        echo -e "${YELLOW}⚠️  Claude command not found in PATH${NC}"
        echo "Try: export PATH=$(npm config get prefix)/bin:\$PATH"
    fi
}

# 配置 Claude 认证
configure_authentication() {
    echo ""
    echo "🔐 Configuring Claude authentication..."
    
    # 检查是否已认证
    if claude whoami >/dev/null 2>&1; then
        echo "✅ Claude is already authenticated"
        claude whoami
        return 0
    fi
    
    # GitHub Actions 环境
    if [[ "$ENV_TYPE" == "github-actions" ]]; then
        # 检查环境变量
        if [[ -n "$CLAUDE_API_TOKEN" ]]; then
            echo "📝 Using API token from environment"
            mkdir -p ~/.config/claude
            echo "{\"apiKey\": \"$CLAUDE_API_TOKEN\"}" > ~/.config/claude/config.json
            chmod 600 ~/.config/claude/config.json
            return 0
        elif [[ -n "$CLAUDE_CONFIG_BASE64" ]]; then
            echo "📝 Using base64 encoded configuration"
            mkdir -p ~/.claude
            echo "$CLAUDE_CONFIG_BASE64" | base64 -d > ~/.claude/config.json
            chmod 600 ~/.claude/config.json
            return 0
        else
            echo -e "${YELLOW}⚠️  No authentication configured in CI environment${NC}"
            echo "💡 Set CLAUDE_API_TOKEN or CLAUDE_CONFIG_BASE64 in GitHub Secrets"
            return 0
        fi
    fi
    
    # 交互式环境
    if [[ -t 0 ]]; then
        echo "Please choose authentication method:"
        echo "1) Interactive login (recommended)"
        echo "2) Skip for now"
        echo "3) Use environment variable"
        
        read -p "Choice (1-3): " choice
        
        case "$choice" in
            1)
                echo "🔐 Starting interactive login..."
                claude login
                ;;
            2)
                echo "⏭️  Skipping authentication"
                echo "Run 'claude login' when ready"
                ;;
            3)
                if [[ -n "$CLAUDE_API_TOKEN" ]]; then
                    echo "📝 Using CLAUDE_API_TOKEN from environment"
                    mkdir -p ~/.config/claude
                    echo "{\"apiKey\": \"$CLAUDE_API_TOKEN\"}" > ~/.config/claude/config.json
                    chmod 600 ~/.config/claude/config.json
                else
                    echo -e "${RED}❌ CLAUDE_API_TOKEN not found${NC}"
                fi
                ;;
            *)
                echo -e "${RED}❌ Invalid choice${NC}"
                ;;
        esac
    else
        echo -e "${YELLOW}⚠️  Non-interactive environment - skipping authentication${NC}"
    fi
}

# 创建模拟 Claude CLI（用于测试）
create_mock_claude() {
    echo ""
    echo "🎭 Creating mock Claude CLI for testing..."
    
    mkdir -p /tmp/bin
    cat > /tmp/bin/claude << 'MOCK_EOF'
#!/bin/bash
# Mock Claude CLI for testing
if [[ "$1" == "-p" ]] && [[ "$3" == "--json" ]]; then
  cat << 'JSON_EOF'
{
  "overall_score": 9,
  "security_issues": [],
  "performance_concerns": [],
  "quality_issues": [],
  "typescript_issues": [],
  "react_issues": [],
  "issues": [],
  "detailed_analysis": "Mock review: Code follows best practices.",
  "recommendations": ["Continue following TypeScript strict mode"],
  "approved": true,
  "stats": {
    "files_reviewed": 1,
    "lines_changed": 50,
    "test_coverage_impact": "positive"
  }
}
JSON_EOF
else
  echo "Claude Code CLI (Mock Version)"
fi
MOCK_EOF
    chmod +x /tmp/bin/claude
    export PATH="/tmp/bin:$PATH"
    echo "✅ Mock Claude CLI created"
}

# 显示使用说明
show_instructions() {
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "📋 Setup Complete!"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    if [[ "$ENV_TYPE" == "docker" ]]; then
        echo ""
        echo "🐳 Docker Configuration:"
        echo "Add these volumes to persist Claude config:"
        echo "  volumes:"
        echo "    - ./claude-config:/home/runner/.claude"
        echo "    - ./claude-config:/home/runner/.config/claude"
    fi
    
    if [[ "$ENV_TYPE" == "github-actions" ]] || [[ "$USE_SELF_HOSTED" == "true" ]]; then
        echo ""
        echo "🔧 GitHub Configuration:"
        echo "1. Add USE_SELF_HOSTED_RUNNER=true in repo variables"
        echo "2. Configure authentication in GitHub Secrets"
        echo "3. Create a PR to test code review"
    fi
    
    echo ""
    echo "🧪 Test Commands:"
    echo "  claude --version"
    echo "  claude whoami"
    echo "  claude --help"
    
    echo ""
    echo "📚 Documentation:"
    echo "  - Usage Guide: .github/scripts/README.md"
    echo "  - Claude Docs: https://docs.anthropic.com/claude-code"
}

# 主执行流程
main() {
    # 解析参数
    while [[ $# -gt 0 ]]; do
        case $1 in
            --mock)
                USE_MOCK=true
                shift
                ;;
            --self-hosted)
                USE_SELF_HOSTED=true
                shift
                ;;
            --help)
                echo "Usage: $0 [options]"
                echo "Options:"
                echo "  --mock         Create mock Claude CLI for testing"
                echo "  --self-hosted  Configure for self-hosted runner"
                echo "  --help         Show this help message"
                exit 0
                ;;
            *)
                echo -e "${RED}Unknown option: $1${NC}"
                exit 1
                ;;
        esac
    done
    
    # 检测环境
    detect_environment
    
    # 使用模拟模式
    if [[ "$USE_MOCK" == "true" ]]; then
        create_mock_claude
        show_instructions
        exit 0
    fi
    
    # 安装 Node.js
    if ! install_nodejs; then
        echo -e "${RED}❌ Failed to install Node.js${NC}"
        exit 1
    fi
    
    echo ""
    
    # 安装 Claude CLI
    if ! install_claude_cli; then
        echo -e "${RED}❌ Failed to install Claude CLI${NC}"
        echo "💡 Try manual installation: npm install -g @anthropic-ai/claude-code"
        exit 1
    fi
    
    # 配置认证
    configure_authentication
    
    # 显示说明
    show_instructions
    
    echo ""
    echo "✅ Setup completed successfully!"
}

# 运行主流程
main "$@"