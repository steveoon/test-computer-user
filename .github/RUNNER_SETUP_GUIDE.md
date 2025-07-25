# Claude Code Review Runner 配置指南

本文档说明如何为 Claude Code Review 配置运行环境。

## 🚀 配置选项概览

### 选项 1：使用 GitHub 托管的 Runner（默认）
- 无需额外配置
- 使用模拟模式进行测试
- 适合验证工作流程

### 选项 2：使用自托管 Runner（推荐生产环境）
- 在自己的服务器上运行
- 支持真实的 Claude Code 审查
- 需要预先配置认证

### 选项 3：等待官方 API 支持
- 未来可能支持 API Key 认证
- 届时可通过 GitHub Secrets 配置

## 🔧 自托管 Runner 配置

### 前提条件
- Linux 服务器（Ubuntu 20.04+ 推荐）
- Docker 和 Docker Compose
- 稳定的网络连接

### 步骤 1：安装 GitHub Actions Runner

在你的服务器上执行：

```bash
# 创建 runner 目录
mkdir ~/actions-runner && cd ~/actions-runner

# 下载最新版本的 runner
curl -o actions-runner-linux-x64-2.311.0.tar.gz -L https://github.com/actions/runner/releases/download/v2.311.0/actions-runner-linux-x64-2.311.0.tar.gz

# 解压
tar xzf ./actions-runner-linux-x64-2.311.0.tar.gz

# 配置 runner（需要从 GitHub 仓库获取 token）
./config.sh --url https://github.com/YOUR_ORG/YOUR_REPO --token YOUR_TOKEN
```

### 步骤 2：安装 Claude Code

```bash
# 使用统一安装脚本
curl -fsSL https://raw.githubusercontent.com/YOUR_REPO/main/.github/scripts/setup-claude.sh | bash

# 或手动安装
npm install -g @anthropic-ai/claude-code
claude login
```

### 步骤 3：配置持久化（Docker 环境）

如果使用 Docker 运行 runner：

```yaml
# docker-compose.yml
services:
  github-runner:
    image: myoung34/github-runner:latest
    environment:
      - REPO_URL=https://github.com/YOUR_ORG/YOUR_REPO
      - RUNNER_TOKEN=${RUNNER_TOKEN}
      - RUNNER_NAME=claude-runner
      - RUNNER_WORKDIR=/tmp/runner/work
      - LABELS=self-hosted,linux,x64,claude
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
      - ./claude-config:/home/runner/.claude
      - ./claude-config:/home/runner/.config/claude
      - ./work:/tmp/runner/work
```

### 步骤 4：启用自托管 Runner

1. 进入 GitHub 仓库设置
2. Settings → Secrets and variables → Variables
3. 添加仓库变量：
   - **名称**: `USE_SELF_HOSTED_RUNNER`
   - **值**: `true`

## 🔑 认证配置

### 方式 1：交互式登录（推荐）
在 runner 上直接执行：
```bash
claude login
```

### 方式 2：使用配置文件
如果你有现有的 Claude 配置：

1. 导出配置为 base64：
   ```bash
   cat ~/.claude/config.json | base64 -w 0
   ```

2. 在 GitHub Secrets 中添加：
   - **Secret 名称**: `CLAUDE_CONFIG`
   - **值**: 上面生成的 base64 字符串

### 方式 3：API Token（未来支持）
当 Claude Code 支持 API 认证时：
- **Secret 名称**: `CLAUDE_API_TOKEN`
- **值**: `sk-ant-...`

## 📋 GitHub Secrets 配置

在仓库的 **Settings** → **Secrets and variables** → **Actions** 中配置：

| Secret 名称 | 说明 | 必需 |
|------------|------|------|
| `CLAUDE_API_TOKEN` | Claude API Token（如果支持） | 否 |
| `CLAUDE_CONFIG` | Base64 编码的配置文件 | 否 |

## ✅ 验证配置

### 1. 检查 Runner 状态
```bash
# 查看 runner 服务状态
sudo ./svc.sh status

# 查看 runner 日志
journalctl -u actions.runner.* -f
```

### 2. 测试 Claude CLI
```bash
# 在 runner 环境中
claude --version
claude whoami
```

### 3. 创建测试 PR
创建一个简单的代码更改，提交 PR，检查 Claude Code Review 是否正常工作。

## 🚨 故障排除

### Runner 无法连接
- 检查防火墙设置
- 确认 runner token 有效
- 查看 runner 日志

### Claude 命令找不到
```bash
# 检查 PATH
echo $PATH

# 手动添加到 PATH
export PATH=/usr/local/bin:$PATH
```

### 认证失败
- 确认已执行 `claude login`
- 检查配置文件权限：`chmod 600 ~/.claude/config.json`
- 尝试重新登录

### 权限问题
```bash
# 修复 runner 工作目录权限
sudo chown -R runner:runner /home/runner/_work
```

## 🔒 安全建议

1. **定期更新**
   - 更新 GitHub Runner
   - 更新 Claude CLI
   - 更新系统依赖

2. **访问控制**
   - 限制 runner 的网络访问
   - 使用专用用户运行 runner
   - 定期轮换认证凭据

3. **监控**
   - 设置日志收集
   - 监控 runner 健康状态
   - 设置告警通知

## 📚 相关资源

- [GitHub Actions 自托管 Runner 文档](https://docs.github.com/en/actions/hosting-your-own-runners)
- [Claude Code 文档](https://docs.anthropic.com/claude-code)
- [项目使用说明](.github/scripts/README.md)