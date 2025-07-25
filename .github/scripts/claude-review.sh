#!/bin/bash

set -e

CHANGED_FILES="$1"
REVIEW_CONFIG=".github/scripts/review-config.json"
REVIEW_PROMPT_TEMPLATE=".github/templates/review-prompt.md"

# 确保必要的工具已安装
command -v jq >/dev/null 2>&1 || { echo "❌ jq is required but not installed. Aborting." >&2; exit 1; }
command -v claude >/dev/null 2>&1 || { echo "❌ claude CLI is required but not installed. Aborting." >&2; exit 1; }

# 读取审查配置
echo "📖 Reading review configuration..."
SEVERITY_THRESHOLD=$(jq -r '.severity_threshold' $REVIEW_CONFIG)
QUALITY_THRESHOLD=$(jq -r '.quality_threshold' $REVIEW_CONFIG)
EXCLUDED_PATTERNS=$(jq -r '.excluded_files[]' $REVIEW_CONFIG | paste -sd '|' -)

# 过滤变更文件，只保留需要审查的文件
echo "🔍 Filtering files for review..."
FILTERED_FILES=""
for file in $CHANGED_FILES; do
    # 检查是否匹配排除模式
    if [[ ! "$file" =~ $EXCLUDED_PATTERNS ]] && [[ "$file" =~ \.(ts|tsx|js|jsx)$ ]]; then
        FILTERED_FILES="$FILTERED_FILES $file"
    fi
done

# 如果没有需要审查的文件，直接通过
if [ -z "$FILTERED_FILES" ]; then
    echo "✅ No files to review (all files are excluded or non-code files)"
    # 创建一个默认的通过结果
    cat > review_result.json << EOF
{
  "overall_score": 10,
  "security_issues": [],
  "performance_concerns": [],
  "quality_issues": [],
  "typescript_issues": [],
  "react_issues": [],
  "issues": [],
  "detailed_analysis": "No code files to review.",
  "recommendations": [],
  "approved": true
}
EOF
    exit 0
fi

echo "📝 Files to review: $FILTERED_FILES"

# 生成 Git diff（只包含需要审查的文件）
echo "🔄 Generating Git diff..."
> current_diff.patch
for file in $FILTERED_FILES; do
    git diff origin/$GITHUB_BASE_REF..HEAD -- "$file" >> current_diff.patch || true
done

# 检查 diff 大小，防止过大
DIFF_SIZE=$(wc -c < current_diff.patch)
MAX_DIFF_SIZE=500000  # 500KB
if [ $DIFF_SIZE -gt $MAX_DIFF_SIZE ]; then
    echo "⚠️ Diff is too large ($DIFF_SIZE bytes), truncating..."
    head -c $MAX_DIFF_SIZE current_diff.patch > temp_diff.patch
    mv temp_diff.patch current_diff.patch
fi

# 读取项目特定的审查提示模板
REVIEW_TEMPLATE=""
if [ -f "$REVIEW_PROMPT_TEMPLATE" ]; then
    REVIEW_TEMPLATE=$(cat "$REVIEW_PROMPT_TEMPLATE")
fi

# 构建审查提示
REVIEW_PROMPT=$(cat << 'EOF'
你是一位专精于 Next.js、TypeScript 和 AI 集成的高级全栈工程师。请审查以下代码变更并以JSON格式返回结果。

## 项目技术栈
- Next.js 15 + React 19
- TypeScript (严格模式)
- AI SDK (Anthropic, OpenAI, Google, Qwen)
- Zustand 状态管理
- Zod schema 验证
- TailwindCSS + Radix UI

## 变更文件
$FILTERED_FILES

## Git Diff
```diff
$(cat current_diff.patch)
```

## 审查要求

### 1. TypeScript 严格模式
- 禁止使用 any 类型（必须使用 unknown 和类型收窄）
- 所有函数参数和返回值必须有明确类型
- 正确处理 null 和 undefined
- Zod schema 与 TypeScript 类型一致性

### 2. React/Next.js 最佳实践
- 组件命名 (PascalCase)
- Hooks 规则 (use前缀，依赖数组)
- Server/Client Components 正确使用
- 避免不必要的客户端渲染

### 3. AI SDK 集成
- 工具 schema 使用 Zod 验证
- 正确处理流式响应
- message.parts 数组处理（非 content 数组）
- 错误边界实现

### 4. 安全性
- 环境变量正确使用
- 避免硬编码密钥
- XSS 防护
- 输入验证

### 5. 性能
- React.memo 适当使用
- useCallback/useMemo 优化
- 懒加载实现
- Bundle size 考虑

### 6. 代码风格
- 双引号
- 分号结尾
- 2空格缩进
- 100字符行宽

## 输出格式
请严格按照以下JSON格式返回审查结果，不要包含其他内容：

```json
{
  "overall_score": 8,
  "security_issues": [
    {
      "severity": "high",
      "description": "问题描述",
      "file": "文件路径",
      "line": 1,
      "suggestion": "修复建议",
      "code_example": "修复代码示例"
    }
  ],
  "performance_concerns": [
    {
      "severity": "medium",
      "description": "性能问题",
      "file": "文件路径",
      "line": 1,
      "suggestion": "优化建议",
      "code_example": "优化代码示例"
    }
  ],
  "quality_issues": [
    {
      "severity": "low",
      "description": "质量问题",
      "file": "文件路径",
      "line": 1,
      "suggestion": "改进建议"
    }
  ],
  "typescript_issues": [
    {
      "severity": "high",
      "description": "TypeScript类型问题",
      "file": "文件路径",
      "line": 1,
      "suggestion": "类型修复建议",
      "code_example": "正确的类型定义"
    }
  ],
  "react_issues": [
    {
      "severity": "medium",
      "description": "React最佳实践问题",
      "file": "文件路径",
      "line": 1,
      "suggestion": "改进建议",
      "code_example": "最佳实践示例"
    }
  ],
  "issues": [],
  "detailed_analysis": "详细的分析总结，包括代码的优点和需要改进的地方",
  "recommendations": ["具体建议1", "具体建议2"],
  "approved": true,
  "stats": {
    "files_reviewed": 1,
    "lines_changed": 100,
    "test_coverage_impact": "positive/negative/neutral"
  }
}
```

特别注意：
1. overall_score 必须是 1-10 的整数，8分为合格线
2. severity 只能是 "high", "medium", "low"
3. 每个问题必须包含具体的文件路径和行号
4. TypeScript 相关问题归入 typescript_issues
5. React/Next.js 相关问题归入 react_issues
6. approved 为 false 时表示代码需要修改后才能合并
EOF
)

# 替换变量
REVIEW_PROMPT=$(echo "$REVIEW_PROMPT" | sed "s/\$FILTERED_FILES/$FILTERED_FILES/g")

# 调用 Claude Code 进行审查（无头模式）
echo "🤖 Starting Claude Code Review..."
echo "📊 Reviewing $(echo $FILTERED_FILES | wc -w) files..."

# 创建临时文件存储prompt
TEMP_PROMPT_FILE=$(mktemp)
echo "$REVIEW_PROMPT" > "$TEMP_PROMPT_FILE"

# Claude Code CLI 不支持 -p 和 --json 参数
# 使用管道方式传递输入
echo "开始代码审查，请以JSON格式返回结果..." >> "$TEMP_PROMPT_FILE"
cat "$TEMP_PROMPT_FILE" | claude > review_raw.txt 2>review_error.log

# 清理临时文件
rm -f "$TEMP_PROMPT_FILE"

# 从 Claude 输出中提取 JSON
if [ -f review_raw.txt ]; then
    echo "📝 Processing Claude output..."
    # 尝试提取 ```json 和 ``` 之间的内容
    sed -n '/```json/,/```/{//!p}' review_raw.txt > review_result.json
    
    # 如果没有找到 JSON 块，检查是否整个输出就是 JSON
    if [ ! -s review_result.json ]; then
        # 尝试直接解析为 JSON
        if jq . review_raw.txt > /dev/null 2>&1; then
            cp review_raw.txt review_result.json
        else
            echo "❌ Claude 没有返回有效的 JSON 格式"
            cat review_raw.txt
        fi
    fi
fi

# 检查命令执行结果
if [ ! -f review_result.json ] || [ ! -s review_result.json ]; then
    echo "❌ Claude Code command failed"
    echo "Error log:"
    cat review_error.log
    
    # 创建一个错误结果
    cat > review_result.json << EOF
{
  "overall_score": 0,
  "security_issues": [],
  "performance_concerns": [],
  "quality_issues": [],
  "typescript_issues": [],
  "react_issues": [],
  "issues": [],
  "detailed_analysis": "Code review failed due to Claude CLI error.",
  "recommendations": ["Please check Claude CLI configuration and try again."],
  "approved": false,
  "error": true
}
EOF
    exit 1
fi

# 验证输出格式
if ! jq empty review_result.json 2>/dev/null; then
    echo "❌ Invalid JSON response from Claude"
    echo "Response content:"
    cat review_result.json
    
    # 尝试提取有效的JSON
    echo "🔧 Attempting to extract valid JSON..."
    # 尝试从输出中提取JSON块
    sed -n '/^{/,/^}/p' review_result.json > temp_review.json
    if jq empty temp_review.json 2>/dev/null; then
        mv temp_review.json review_result.json
        echo "✅ Successfully extracted valid JSON"
    else
        echo "❌ Failed to extract valid JSON"
        exit 1
    fi
fi

# 确保所有必需的字段存在
echo "🔍 Validating review result structure..."
jq '. + {
  "typescript_issues": (.typescript_issues // []),
  "react_issues": (.react_issues // []),
  "stats": (.stats // {
    "files_reviewed": '$(echo $FILTERED_FILES | wc -w)',
    "lines_changed": '$$(wc -l < current_diff.patch)',
    "test_coverage_impact": "unknown"
  })
}' review_result.json > temp.json && mv temp.json review_result.json

# 合并所有issue类型到issues数组（为了兼容GitHub Actions脚本）
jq '.issues = (.security_issues + .performance_concerns + .quality_issues + .typescript_issues + .react_issues)' review_result.json > temp.json && mv temp.json review_result.json

echo "✅ Review completed successfully"

# 输出审查摘要
echo ""
echo "## 📊 Review Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Overall Score: $(jq -r '.overall_score' review_result.json)/10"
echo "Files Reviewed: $(jq -r '.stats.files_reviewed' review_result.json)"
echo "Lines Changed: $(jq -r '.stats.lines_changed' review_result.json)"
echo ""
echo "Issues Found:"
echo "  🔒 Security Issues: $(jq -r '.security_issues | length' review_result.json)"
echo "  ⚡ Performance Concerns: $(jq -r '.performance_concerns | length' review_result.json)"
echo "  🏗️ Quality Issues: $(jq -r '.quality_issues | length' review_result.json)"
echo "  📘 TypeScript Issues: $(jq -r '.typescript_issues | length' review_result.json)"
echo "  ⚛️ React/Next.js Issues: $(jq -r '.react_issues | length' review_result.json)"
echo ""
echo "Total Issues: $(jq -r '.issues | length' review_result.json)"
echo "Review Status: $(jq -r 'if .approved then "✅ APPROVED" else "❌ CHANGES REQUIRED" end' review_result.json)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 清理临时文件
rm -f current_diff.patch review_error.log