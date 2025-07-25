# Claude Code Review Integration

这是一个使用Claude Code无头模式进行自动化代码审查的GitHub Actions集成方案。

## 功能特点

- 🔍 自动审查Pull Request中的代码变更
- 🔒 安全性检查（SQL注入、XSS、认证问题等）
- ⚡ 性能分析（算法复杂度、查询优化等）
- 🏗️ 代码质量评估（命名规范、复杂度、重复代码等）
- 🧪 测试覆盖率检查
- 📊 评分系统（1-10分）
- 🚫 自动阻止不合格的代码合并

## 配置说明

### 1. Claude Code设置

由于使用账户登录而非API KEY，需要在GitHub Actions runner上配置Claude Code CLI的认证。可以考虑以下方案：

- 使用GitHub Secrets存储认证信息
- 在自托管的runner上预先配置Claude账户
- 使用GitHub Actions的安全环境变量

### 2. 审查配置

编辑 `.github/scripts/review-config.json` 来自定义审查规则：

```json
{
  "severity_threshold": "medium",  // 严重程度阈值
  "quality_threshold": 7,          // 质量分数阈值（1-10）
  "blocked_patterns": [],          // 禁止的代码模式
  "required_tests": true           // 是否要求测试
}
```

### 3. 工作流触发

工作流会在以下情况自动触发：
- 创建新的Pull Request
- 更新现有Pull Request的代码

## 使用方法

1. **基本使用**：代码审查会自动运行，无需手动操作

2. **查看结果**：审查结果会作为PR评论自动发布

3. **处理阻塞**：如果代码未通过审查，需要修复问题后重新提交

## 本地测试

### 快速测试

使用提供的本地测试脚本：

```bash
# 基本用法（默认与 main 分支比较）
bash .github/scripts/test-review-local.sh

# 指定基准分支
bash .github/scripts/test-review-local.sh develop

# 如果没有变更，脚本会自动创建一个测试文件
```

### 手动测试

也可以手动运行审查脚本：

```bash
# 设置环境变量（模拟GitHub Actions环境）
export GITHUB_BASE_REF=main

# 运行审查脚本
bash .github/scripts/claude-review.sh "src/index.js src/utils.js"
```

### 测试特定文件

创建一个测试文件来验证审查功能：

```typescript
// test-review.tsx
import React from 'react';

interface Props {
  data: any; // 故意使用 any 类型
}

export const TestComponent = ({ data }: Props) => {
  console.log(data); // 故意留下 console.log
  
  return (
    <div dangerouslySetInnerHTML={{ __html: data.html }} /> // XSS 风险
  );
};
```

然后运行：
```bash
bash .github/scripts/claude-review.sh "test-review.tsx"
```

## 故障排除

### Claude CLI 安装和配置

#### 安装 Claude Code CLI

Claude Code 是一个 npm 包，需要 Node.js 环境：

```bash
# 安装 Node.js（如果没有）
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# macOS (使用 Homebrew)
brew install node

# 安装 Claude Code
npm install -g @anthropic-ai/claude-code

# 验证安装
claude --version
```

#### 登录认证
```bash
# 使用账户登录（推荐）
claude login

# 验证登录状态
claude whoami

# 检查版本
claude --version
```

#### GitHub Actions 配置

由于 GitHub Actions 运行在无头环境，需要特殊的认证配置：

**选项 1：使用自托管 Runner**
在自己的服务器上配置 GitHub Actions Runner，预先登录 Claude：
```bash
# 在 runner 上执行
claude login
# 完成认证后，runner 即可使用 claude 命令
```

**选项 2：使用 Claude API（如果未来支持）**
```yaml
# 在 GitHub Secrets 中设置 CLAUDE_API_KEY
env:
  CLAUDE_API_KEY: ${{ secrets.CLAUDE_API_KEY }}
```

**选项 3：使用模拟模式**
工作流已包含模拟模式，可以在没有真实 Claude CLI 的情况下测试流程。

### JSON解析错误
检查Claude的输出是否为有效JSON：
```bash
# 查看错误日志
cat review_error.log

# 手动测试Claude响应
claude -p "输出JSON: {\"test\": true}" --json
```

### 权限问题
确保GitHub Actions有必要的权限：
- `contents: read` - 读取代码
- `pull-requests: write` - 发布评论
- `checks: write` - 更新检查状态

## 自定义扩展

### 添加新的检查规则
编辑 `review-config.json` 中的 `review_checks` 部分：

```json
"custom_check": {
  "enabled": true,
  "patterns": ["your_pattern"],
  "message": "自定义检查消息"
}
```

### 修改审查提示
编辑 `.github/templates/review-prompt.md` 来自定义审查重点。

### 集成其他工具
可以在工作流中添加其他步骤，如：
- ESLint/Prettier检查
- 单元测试运行
- 代码覆盖率报告

## 注意事项

1. **成本考虑**：每次PR都会调用Claude，注意使用频率
2. **响应时间**：大型diff可能需要较长处理时间
3. **隐私安全**：确保不会将敏感代码发送给Claude
4. **误报处理**：AI可能产生误报，需要人工复核

## 未来改进

- [ ] 支持增量审查（只审查新增/修改的部分）
- [ ] 添加审查结果缓存
- [ ] 支持自定义审查模板
- [ ] 集成更多代码质量工具
- [ ] 支持多语言审查规则