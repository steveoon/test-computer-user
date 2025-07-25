#!/bin/bash

# 本地测试代码审查脚本
# 用于在不创建PR的情况下测试Claude Code Review功能

set -e

echo "🧪 Claude Code Review - Local Test Script"
echo "========================================"

# 检查是否在git仓库中
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo "❌ Not in a git repository. Please run this script from a git repository."
    exit 1
fi

# 获取当前分支
CURRENT_BRANCH=$(git branch --show-current)
echo "📍 Current branch: $CURRENT_BRANCH"

# 设置默认的基准分支
BASE_BRANCH="${1:-main}"
echo "📍 Base branch: $BASE_BRANCH"

# 检查基准分支是否存在
if ! git show-ref --verify --quiet refs/heads/$BASE_BRANCH && ! git show-ref --verify --quiet refs/remotes/origin/$BASE_BRANCH; then
    echo "❌ Base branch '$BASE_BRANCH' not found."
    echo "💡 Usage: $0 [base-branch]"
    echo "   Example: $0 develop"
    exit 1
fi

# 设置环境变量（模拟GitHub Actions环境）
export GITHUB_BASE_REF=$BASE_BRANCH

# 获取变更文件
echo ""
echo "🔍 Detecting changed files..."
if git show-ref --verify --quiet refs/heads/$BASE_BRANCH; then
    # 本地分支存在
    CHANGED_FILES=$(git diff --name-only $BASE_BRANCH..HEAD 2>/dev/null || echo "")
else
    # 使用远程分支
    CHANGED_FILES=$(git diff --name-only origin/$BASE_BRANCH..HEAD 2>/dev/null || echo "")
fi

if [ -z "$CHANGED_FILES" ]; then
    echo "ℹ️ No changes detected. Creating a test change..."
    
    # 创建一个临时测试文件
    TEST_FILE="test-review-$(date +%s).tsx"
    cat > $TEST_FILE << 'EOF'
import React from 'react';

// 这是一个测试文件，包含一些需要审查的问题

interface Props {
  data: any; // 使用了any类型
  onUpdate: Function; // 使用了Function类型
}

export const TestComponent = ({ data, onUpdate }: Props) => {
  const [count, setCount] = React.useState(0);
  
  // 缺少useCallback
  const handleClick = () => {
    console.log('clicked'); // 包含console.log
    eval('alert("test")'); // 安全问题：使用了eval
    onUpdate(count + 1);
  };
  
  // 缺少依赖数组
  React.useEffect(() => {
    document.title = `Count: ${count}`;
  });
  
  return (
    <div>
      <h1>Test Component</h1>
      <p dangerouslySetInnerHTML={{ __html: data.content }} /> {/* XSS风险 */}
      <button onClick={handleClick}>
        Click me
      </button>
    </div>
  );
};

// 缺少默认导出
EOF
    
    echo "✅ Created test file: $TEST_FILE"
    CHANGED_FILES=$TEST_FILE
    
    # 添加清理函数
    trap "rm -f $TEST_FILE" EXIT
fi

echo "📝 Files to review:"
echo "$CHANGED_FILES" | sed 's/^/   - /'

# 运行审查脚本
echo ""
echo "🤖 Running Claude Code Review..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 运行审查
if bash .github/scripts/claude-review.sh "$CHANGED_FILES"; then
    echo ""
    echo "✅ Review completed successfully!"
else
    echo ""
    echo "❌ Review failed!"
fi

# 显示审查结果
if [ -f review_result.json ]; then
    echo ""
    echo "📋 Review Result:"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    # 美化输出JSON结果
    if command -v jq >/dev/null 2>&1; then
        jq '.' review_result.json
    else
        cat review_result.json
    fi
    
    echo ""
    echo "💡 Tip: The full review result is saved in 'review_result.json'"
    echo "💡 You can view it with: jq '.' review_result.json"
fi

echo ""
echo "🎉 Local test completed!"
echo ""
echo "📚 Next steps:"
echo "   1. Review the output above"
echo "   2. Fix any issues found"
echo "   3. Run the test again to verify fixes"
echo "   4. Create a PR when ready"